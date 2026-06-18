"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled } from "@/src/domain/services/money";
import { CreateOpportunityUseCase } from "@/src/application/use-cases/crm/CreateOpportunityUseCase";
import { MoveStageUseCase } from "@/src/application/use-cases/crm/MoveStageUseCase";
import { MarkLostUseCase } from "@/src/application/use-cases/crm/MarkLostUseCase";
import { ReopenOpportunityUseCase } from "@/src/application/use-cases/crm/ReopenOpportunityUseCase";
import { ConvertToQuotationUseCase } from "@/src/application/use-cases/crm/ConvertToQuotationUseCase";

export interface FormState {
  error?: string;
  success?: string;
}

const oppSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อโอกาสการขาย"),
  partnerId: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  expectedRevenue: z.string().regex(/^\d+(\.\d+)?$/).optional().or(z.literal("")),
  probability: z.string().optional(),
});

export async function createOpportunityAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  const parsed = oppSchema.safeParse({
    name: formData.get("name"),
    partnerId: formData.get("partnerId") || undefined,
    contactName: formData.get("contactName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    expectedRevenue: formData.get("expectedRevenue") || undefined,
    probability: formData.get("probability") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  let oppId: string;
  try {
    const opp = await new CreateOpportunityUseCase(
      container.crmStageRepository,
      container.opportunityRepository,
    ).execute({
      shopId,
      name: parsed.data.name,
      partnerId: parsed.data.partnerId ?? null,
      contactName: parsed.data.contactName ?? null,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      expectedRevenue: parsed.data.expectedRevenue ? parseScaled(parsed.data.expectedRevenue, 100) : 0,
      probability: parsed.data.probability ? Number(parsed.data.probability) : 0,
    });
    oppId = opp.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/crm");
  redirect(`/shop/crm/${oppId}`);
}

export async function moveStageAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  await new MoveStageUseCase(
    container.crmStageRepository,
    container.opportunityRepository,
  ).execute(user.shopId!, id, stageId);
  revalidatePath("/shop/crm");
  revalidatePath(`/shop/crm/${id}`);
}

export async function markLostAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  await new MarkLostUseCase(container.opportunityRepository).execute(user.shopId!, id, reason);
  revalidatePath(`/shop/crm/${id}`);
}

export async function reopenOpportunityAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  await new ReopenOpportunityUseCase(container.opportunityRepository).execute(user.shopId!, id);
  revalidatePath(`/shop/crm/${id}`);
}

export async function convertToQuotationAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const order = await new ConvertToQuotationUseCase(
    container.opportunityRepository,
    container.salesOrderRepository,
    container.crmStageRepository,
  ).execute(user.shopId!, id, new Date().toISOString());
  revalidatePath(`/shop/crm/${id}`);
  redirect(`/shop/sales/${order.id}`);
}
