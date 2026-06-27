import Link from "next/link";
import { BookOpen, ListTree, Scale, FileSpreadsheet, Banknote, ArrowRight, Plus } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { GetTrialBalanceUseCase } from "@/src/application/use-cases/accounting/GetTrialBalanceUseCase";
import { ACCOUNT_CODES, signedBalance } from "@/src/domain/services/accounting";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Button } from "@/src/presentation/components/ui/Button";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";

const LINKS = [
  { href: "/shop/accounting/entries", label: "สมุดรายวัน", desc: "รายการบัญชีทั้งหมด", icon: BookOpen },
  { href: "/shop/accounting/accounts", label: "ผังบัญชี", desc: "บัญชีแยกประเภท", icon: ListTree },
  { href: "/shop/accounting/trial-balance", label: "งบทดลอง", desc: "เดบิต/เครดิต + กำไรสุทธิ", icon: Scale },
  { href: "/shop/accounting/vat", label: "ภาษีมูลค่าเพิ่ม (ภพ.30)", desc: "สรุปภาษีขาย-ซื้อ + ยื่น", icon: FileSpreadsheet },
  { href: "/shop/accounting/receivables", label: "ลูกหนี้/อายุหนี้", desc: "AR aging + ส่งใบทวง", icon: Banknote },
];

export default async function AccountingPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const tb = await new GetTrialBalanceUseCase(
    container.accountRepository,
    container.journalEntryRepository,
  ).execute(shopId);

  const byCode = new Map(tb.rows.map((r) => [r.code, r]));
  const bal = (code: string) => {
    const r = byCode.get(code);
    return r ? signedBalance(r.type, r.debit, r.credit) : 0;
  };

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "บัญชี" }]} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">บัญชี</h1>
        <Link href="/shop/accounting/entries/new">
          <Button>
            <Plus className="size-4" />
            ลงรายการด้วยมือ
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="ลูกหนี้การค้า" value={`฿${formatScaled(bal(ACCOUNT_CODES.ar), 100)}`} />
        <StatCard label="เจ้าหนี้การค้า" value={`฿${formatScaled(bal(ACCOUNT_CODES.ap), 100)}`} />
        <StatCard label="เงินสด/ธนาคาร" value={`฿${formatScaled(bal(ACCOUNT_CODES.cash), 100)}`} />
        <StatCard label="กำไรสุทธิ" value={`฿${formatScaled(tb.netProfit, 100)}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
