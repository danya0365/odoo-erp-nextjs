"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { createSession, destroySession } from "@/src/infrastructure/auth/session";
import { LoginUseCase } from "@/src/application/use-cases/auth/LoginUseCase";
import { ROLE_HOME } from "@/src/domain/types/roles";

const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export interface FormState {
  error?: string;
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const useCase = new LoginUseCase(container.userRepository, container.passwordHasher);
  const user = await useCase.execute(parsed.data.email, parsed.data.password);
  if (!user) return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };

  await createSession(user.id);
  redirect(ROLE_HOME[user.role]); // redirect throw — อยู่นอก try/catch
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
