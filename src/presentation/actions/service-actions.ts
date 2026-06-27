"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { CreateServiceTicketUseCase, AssignServiceTicketUseCase, CloseServiceTicketUseCase } from "@/src/application/use-cases/service/ServiceTicketUseCases";

export interface FormState {
  error?: string;
  success?: string;
}

const createSchema = z.object({
  customerId: z.string().min(1, "กรุณาเลือกลูกค้า"),
  subject: z.string().min(1, "กรุณาระบุเรื่อง"),
  description: z.string().optional(),
});

export async function createServiceTicketAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = createSchema.safeParse({
    customerId: formData.get("customerId"),
    subject: formData.get("subject"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  let ticketId: string;
  try {
    const t = await new CreateServiceTicketUseCase(
      container.serviceTicketRepository,
      container.partnerRepository,
      container.sequenceRepository,
    ).execute(user.shopId!, parsed.data.customerId, parsed.data.subject, parsed.data.description ?? "");
    ticketId = t.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/service");
  redirect(`/shop/service/${ticketId}`);
}

export async function assignServiceTicketAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const assigneeId = String(formData.get("assigneeId") ?? "");
  const scheduledAt = String(formData.get("scheduledAt") ?? "") || null;
  if (!assigneeId) return { error: "กรุณาเลือกช่าง/พนักงาน" };
  try {
    await new AssignServiceTicketUseCase(container.serviceTicketRepository, container.employeeRepository).execute(
      user.shopId!,
      id,
      assigneeId,
      scheduledAt,
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/shop/service/${id}`);
  return { success: "มอบหมายแล้ว" };
}

export async function closeServiceTicketAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  await new CloseServiceTicketUseCase(container.serviceTicketRepository).execute(user.shopId!, id);
  revalidatePath(`/shop/service/${id}`);
}
