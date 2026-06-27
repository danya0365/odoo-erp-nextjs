"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled } from "@/src/domain/services/money";
import { LogAttendanceUseCase, CreateLeaveRequestUseCase, DecideLeaveRequestUseCase } from "@/src/application/use-cases/hr/TimeoffUseCases";
import type { LeaveType } from "@/src/domain/entities";

export interface FormState {
  error?: string;
  success?: string;
}

const attendanceSchema = z.object({
  employeeId: z.string().min(1, "กรุณาเลือกพนักงาน"),
  workDate: z.string().min(1, "กรุณาระบุวันที่"),
  hours: z.string().regex(/^\d+(\.\d+)?$/).optional().or(z.literal("")),
  ot: z.string().regex(/^\d+(\.\d+)?$/).optional().or(z.literal("")),
});

export async function logAttendanceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = attendanceSchema.safeParse({
    employeeId: formData.get("employeeId"),
    workDate: formData.get("workDate"),
    hours: formData.get("hours") || "",
    ot: formData.get("ot") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  try {
    await new LogAttendanceUseCase(container.attendanceRepository, container.employeeRepository).execute(
      user.shopId!,
      parsed.data.employeeId,
      parsed.data.workDate,
      parsed.data.hours ? parseScaled(parsed.data.hours, 100) : 0,
      parsed.data.ot ? parseScaled(parsed.data.ot, 100) : 0,
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/hr/timeoff");
  return { success: "ลงเวลาแล้ว" };
}

const leaveSchema = z.object({
  employeeId: z.string().min(1, "กรุณาเลือกพนักงาน"),
  leaveType: z.enum(["sick", "personal", "vacation"]),
  days: z.string().regex(/^\d+(\.\d+)?$/, "จำนวนวันไม่ถูกต้อง"),
  reason: z.string().optional(),
});

export async function createLeaveAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = leaveSchema.safeParse({
    employeeId: formData.get("employeeId"),
    leaveType: formData.get("leaveType"),
    days: formData.get("days"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  try {
    await new CreateLeaveRequestUseCase(container.leaveRequestRepository, container.employeeRepository).execute(
      user.shopId!,
      parsed.data.employeeId,
      parsed.data.leaveType as LeaveType,
      parseScaled(parsed.data.days, 100),
      parsed.data.reason ?? null,
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/hr/timeoff");
  return { success: "ยื่นขอลาแล้ว" };
}

export async function decideLeaveAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "") === "approved" ? "approved" : "rejected";
  await new DecideLeaveRequestUseCase(container.leaveRequestRepository).execute(user.shopId!, id, decision);
  revalidatePath("/shop/hr/timeoff");
}
