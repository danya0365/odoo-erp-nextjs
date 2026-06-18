"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseHours } from "@/src/domain/services/timesheet";
import type { TaskStatus, ProjectStatus } from "@/src/domain/entities";
import { CreateProjectUseCase } from "@/src/application/use-cases/projects/CreateProjectUseCase";
import { CreateTaskUseCase } from "@/src/application/use-cases/projects/CreateTaskUseCase";
import { SetTaskStatusUseCase } from "@/src/application/use-cases/projects/SetTaskStatusUseCase";
import { LogTimesheetUseCase } from "@/src/application/use-cases/projects/LogTimesheetUseCase";
import { SetProjectStatusUseCase } from "@/src/application/use-cases/projects/SetProjectStatusUseCase";

export interface FormState {
  error?: string;
  success?: string;
}

const projectSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อโครงการ"),
  customerId: z.string().optional(),
});

export async function createProjectAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    customerId: formData.get("customerId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  let projectId: string;
  try {
    const project = await new CreateProjectUseCase(container.projectRepository).execute(
      user.shopId!,
      parsed.data.name,
      parsed.data.customerId ?? null,
    );
    projectId = project.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/projects");
  redirect(`/shop/projects/${projectId}`);
}

export async function createTaskAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "");
  try {
    await new CreateTaskUseCase(container.projectRepository, container.projectTaskRepository).execute(
      user.shopId!,
      projectId,
      name,
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/shop/projects/${projectId}`);
  return { success: "เพิ่มงานแล้ว" };
}

export async function setTaskStatusAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const projectId = String(formData.get("projectId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "") as TaskStatus;
  await new SetTaskStatusUseCase(container.projectTaskRepository).execute(user.shopId!, taskId, status);
  revalidatePath(`/shop/projects/${projectId}`);
}

export async function setProjectStatusAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ProjectStatus;
  await new SetProjectStatusUseCase(container.projectRepository).execute(user.shopId!, id, status);
  revalidatePath(`/shop/projects/${id}`);
}

const logSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().optional(),
  employeeId: z.string().min(1, "กรุณาเลือกพนักงาน"),
  hours: z.string().regex(/^\d+(\.\d+)?$/, "จำนวนชั่วโมงไม่ถูกต้อง"),
  date: z.string().min(1, "กรุณาระบุวันที่"),
  note: z.string().optional(),
});

export async function logTimesheetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const parsed = logSchema.safeParse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId") || undefined,
    employeeId: formData.get("employeeId"),
    hours: formData.get("hours"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  try {
    await new LogTimesheetUseCase(
      container.projectRepository,
      container.projectTaskRepository,
      container.employeeRepository,
      container.timesheetRepository,
    ).execute({
      shopId: user.shopId!,
      projectId: parsed.data.projectId,
      taskId: parsed.data.taskId || null,
      employeeId: parsed.data.employeeId,
      minutes: parseHours(parsed.data.hours),
      date: parsed.data.date,
      note: parsed.data.note ?? null,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/shop/projects/${parsed.data.projectId}`);
  return { success: "ลงเวลาแล้ว" };
}
