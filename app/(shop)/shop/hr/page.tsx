import Link from "next/link";
import { Users2, Wallet, ReceiptText, CalendarDays, ArrowRight } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";

const LINKS = [
  { href: "/shop/hr/employees", label: "พนักงาน", desc: "ข้อมูลพนักงานและเงินเดือน", icon: Users2 },
  { href: "/shop/hr/payroll", label: "เงินเดือน", desc: "งวดจ่าย → ลงบัญชี", icon: Wallet },
  { href: "/shop/hr/expenses", label: "เบิกค่าใช้จ่าย", desc: "ยื่นเบิก → อนุมัติ → จ่ายคืน", icon: ReceiptText },
  { href: "/shop/hr/timeoff", label: "ลงเวลา/การลา", desc: "ลงเวลา/OT + ขอลา → อนุมัติ", icon: CalendarDays },
];

export default async function HrHubPage() {
  const user = await requireRole("shop_owner");
  const active = await container.employeeRepository.listActive(user.shopId!);
  const monthly = active.reduce((s, e) => s + e.baseSalary, 0);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "บุคลากร" }]} />
      <h1 className="text-2xl font-bold">บุคลากร (HR)</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="พนักงานที่ทำงานอยู่" value={String(active.length)} />
        <StatCard label="ฐานเงินเดือนรวม/เดือน" value={`฿${formatScaled(monthly, 100)}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {LINKS.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.href} href={m.href}>
              <Card className="transition-colors hover:border-brand-300">
                <CardBody className="flex items-start gap-4">
                  <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600">
                    <Icon className="size-6" />
                  </span>
                  <div className="flex-1">
                    <h3 className="flex items-center gap-1 font-semibold">
                      {m.label}
                      <ArrowRight className="size-4 text-muted" />
                    </h3>
                    <p className="mt-0.5 text-sm text-muted">{m.desc}</p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
