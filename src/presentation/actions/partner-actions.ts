"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { CreatePartnerUseCase } from "@/src/application/use-cases/contacts/CreatePartnerUseCase";
import { UpdatePartnerUseCase } from "@/src/application/use-cases/contacts/UpdatePartnerUseCase";
import { ArchivePartnerUseCase } from "@/src/application/use-cases/contacts/ArchivePartnerUseCase";

export interface FormState {
  error?: string;
}

const emptyToUndef = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const partnerSchema = z.object({
  name: z.string().trim().min(1, "กรุณาระบุชื่อผู้ติดต่อ"),
  type: z.enum(["customer", "vendor", "both"]),
  email: z.preprocess(emptyToUndef, z.string().email("อีเมลไม่ถูกต้อง").optional()),
  phone: z.preprocess(emptyToUndef, z.string().optional()),
  taxId: z.preprocess(emptyToUndef, z.string().optional()),
  street: z.preprocess(emptyToUndef, z.string().optional()),
  city: z.preprocess(emptyToUndef, z.string().optional()),
  country: z.preprocess(emptyToUndef, z.string().optional()),
  creditTermDays: z.preprocess(emptyToUndef, z.coerce.number().int().min(0).optional()),
  isCompany: z.boolean(),
});

function parsePartner(formData: FormData) {
  return partnerSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    taxId: formData.get("taxId"),
    street: formData.get("street"),
    city: formData.get("city"),
    country: formData.get("country"),
    creditTermDays: formData.get("creditTermDays"),
    isCompany: formData.get("isCompany") === "on",
  });
}

export async function createPartnerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = parsePartner(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  try {
    await new CreatePartnerUseCase(container.partnerRepository).execute({
      shopId: user.shopId!,
      ...parsed.data,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/contacts");
  redirect("/shop/contacts");
}

export async function updatePartnerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const parsed = parsePartner(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  try {
    await new UpdatePartnerUseCase(container.partnerRepository).execute(
      user.shopId!,
      id,
      parsed.data,
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/contacts");
  revalidatePath(`/shop/contacts/${id}`);
  redirect("/shop/contacts");
}

export async function archivePartnerAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";
  await new ArchivePartnerUseCase(container.partnerRepository).execute(
    user.shopId!,
    id,
    isActive,
  );
  revalidatePath("/shop/contacts");
  redirect("/shop/contacts");
}
