import type { Metadata } from "next";
import { Boxes } from "lucide-react";

import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { LoginForm } from "@/src/presentation/components/auth/LoginForm";

export const metadata: Metadata = { title: "เข้าสู่ระบบ — Odoo ERP" };

export default function LoginPage() {
  return (
    <Container className="flex min-h-svh items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Boxes className="size-9 text-brand-500" />
          <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
          <p className="text-sm text-muted">จัดการธุรกิจของคุณด้วย Odoo ERP</p>
        </div>
        <Card>
          <CardBody>
            <LoginForm />
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
