import { Scale, Lock } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { GetFinancialsUseCase } from "@/src/application/use-cases/accounting/GetFinancialsUseCase";
import { closePeriodAction } from "@/src/presentation/actions/bank-actions";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";

const baht = (v: number) => `฿${formatScaled(v, 100)}`;
const currentMonth = () => new Date().toISOString().slice(0, 7);

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-1 ${bold ? "border-t border-border font-semibold" : ""}`}>
      <span className={bold ? "" : "text-muted"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default async function FinancialsPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  const [fs, closes] = await Promise.all([
    new GetFinancialsUseCase(container.accountRepository, container.journalEntryRepository).execute(shopId),
    container.periodCloseRepository.list(shopId),
  ]);
  const month = currentMonth();
  const closedThis = closes.find((c) => c.period === month);

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บัญชี", href: "/shop/accounting" },
          { label: "งบการเงิน" },
        ]}
      />
      <div className="flex items-center gap-3">
        <Scale className="size-7 text-brand-600" />
        <h1 className="text-2xl font-bold">งบการเงิน</h1>
        <Badge variant={fs.balanced ? "success" : "error"}>{fs.balanced ? "งบดุลสมดุล ✓" : "ไม่สมดุล"}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="mb-2 font-semibold">งบกำไรขาดทุน (P&L)</h2>
            <Row label="รายได้" value={baht(fs.income)} />
            <Row label="ค่าใช้จ่าย" value={baht(fs.expense)} />
            <Row label="กำไรสุทธิ" value={baht(fs.netProfit)} bold />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="mb-2 font-semibold">งบดุล (Balance Sheet)</h2>
            <Row label="สินทรัพย์" value={baht(fs.assets)} />
            <Row label="หนี้สิน" value={baht(fs.liabilities)} />
            <Row label="ส่วนของเจ้าของ" value={baht(fs.equity)} />
            <Row label="กำไรสะสมงวด" value={baht(fs.netProfit)} />
            <Row label="หนี้สิน + ทุน + กำไร" value={baht(fs.liabilities + fs.equity + fs.netProfit)} bold />
          </CardBody>
        </Card>
      </div>

      {/* ปิดงวด */}
      <Card>
        <CardBody className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold"><Lock className="size-4" />ปิดงวดบัญชี</h2>
          {closedThis ? (
            <Badge variant="success">ปิดงวด {month} แล้ว</Badge>
          ) : (
            <form action={closePeriodAction} className="flex items-end gap-3">
              <div>
                <label className="mb-1 block text-sm text-muted">งวด (เดือน)</label>
                <Input type="month" name="period" defaultValue={month} aria-label="งวด" />
              </div>
              <Button type="submit"><Lock className="size-4" />ปิดงวด</Button>
            </form>
          )}
          {closes.length > 0 && (
            <p className="text-sm text-muted">งวดที่ปิดแล้ว: {closes.map((c) => c.period).join(", ")}</p>
          )}
        </CardBody>
      </Card>
    </Container>
  );
}
