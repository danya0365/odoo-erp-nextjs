"use client";

import { useActionState } from "react";

import { loginAction, type FormState } from "@/src/presentation/actions/auth-actions";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";

const initialState: FormState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <FormField label="อีเมล" required>
        <Input name="email" type="email" autoComplete="email" placeholder="you@example.com" />
      </FormField>
      <FormField label="รหัสผ่าน" required>
        <Input name="password" type="password" autoComplete="current-password" />
      </FormField>
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </Button>
    </form>
  );
}
