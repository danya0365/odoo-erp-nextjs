"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled } from "@/src/domain/services/money";
import { CreateEmployeeUseCase } from "@/src/application/use-cases/hr/CreateEmployeeUseCase";
import { GeneratePayrollRunUseCase } from "@/src/application/use-cases/hr/GeneratePayrollRunUseCase";
import { PostPayrollRunUseCase } from "@/src/application/use-cases/hr/PostPayrollRunUseCase";
import { postDeps } from "./postingDeps";

export interface FormState {
  error?: string;
  success?: string;
}

const employeeSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อพนักงาน"),
  position: z.string().optional(),
  baseSalary: z.string().regex(/^\d+(\.\d+)?$/, "เงินเดือนไม่ถูกต้อง"),
});

export async function createEmployeeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = employeeSchema.safeParse({
    name: formData.get("name"),
    position: formData.get("position") || undefined,
    baseSalary: formData.get("baseSalary"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  try {
    await new CreateEmployeeUseCase(container.employeeRepository).execute(
      user.shopId!,
      parsed.data.name,
      parsed.data.position ?? null,
      parseScaled(parsed.data.baseSalary, 100),
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/hr/employees");
  return { success: "เพิ่มพนักงานแล้ว" };
}

const runSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "งวดต้องเป็น YYYY-MM"),
  whtRate: z.string().regex(/^\d+(\.\d+)?$/).optional().or(z.literal("")),
});

export async function generatePayrollRunAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = runSchema.safeParse({
    period: formData.get("period"),
    whtRate: formData.get("whtRate") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  // อัตราภาษีเป็น % → basis points (3 → 300)
  const whtRateBp = parsed.data.whtRate ? Math.round(Number(parsed.data.whtRate) * 100) : 0;
  let runId: string;
  try {
    const run = await new GeneratePayrollRunUseCase(
      container.employeeRepository,
      container.payrollRunRepository,
    ).execute(user.shopId!, parsed.data.period, whtRateBp);
    runId = run.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/hr/payroll");
  redirect(`/shop/hr/payroll/${runId}`);
}

export async function postPayrollRunAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  try {
    await new PostPayrollRunUseCase(
      container.payrollRunRepository,
      container.sequenceRepository,
      postDeps(),
    ).execute(user.shopId!, id, new Date().toISOString());
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/shop/hr/payroll/${id}`);
  return { success: "อนุมัติจ่ายเงินเดือนแล้ว" };
}
