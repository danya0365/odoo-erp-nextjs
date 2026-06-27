import { Banknote, BellRing } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { GetArAgingUseCase } from "@/src/application/use-cases/accounting/GetArAgingUseCase";
import { recordDunningAction } from "@/src/presentation/actions/accounting-actions";
import { AGING_BUCKETS, AGING_LABELS } from "@/src/domain/services/ar-aging";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

const baht = (v: number) => (v ? `฿${formatScaled(v, 100)}` : "—");

export default async function ReceivablesPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const asOf = new Date().toISOString();

  const [aging, dunned] = await Promise.all([
    new GetArAgingUseCase(container.invoiceRepository, container.partnerRepository).execute(shopId, asOf),
    container.dunningLogRepository.latestByCustomer(shopId),
  ]);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บัญชี", href: "/shop/accounting" },
          { label: "ลูกหนี้/อายุหนี้" },
        ]}
      />
      <div className="flex items-center gap-3">
        <Banknote className="size-7 text-brand-600" />
        <h1 className="text-2xl font-bold">อายุลูกหนี้ + ทวงหนี้</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {AGING_BUCKETS.map((b) => (
          <StatCard key={b} label={AGING_LABELS[b]} value={baht(aging.totals[b])} />
        ))}
        <StatCard label="ค้างรวม" value={baht(aging.grandTotal)} />
      </div>

      {aging.rows.length === 0 ? (
        <EmptyState title="ไม่มีลูกหนี้ค้างชำระ" description="ใบแจ้งหนี้ที่ออกแล้วชำระครบทั้งหมด" />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>ลูกค้า</Th>
                {AGING_BUCKETS.map((b) => (
                  <Th key={b}>{AGING_LABELS[b]}</Th>
                ))}
                <Th>ค้างรวม</Th>
                <Th>ทวงล่าสุด</Th>
                <Th></Th>
              </Tr>
            </THead>
            <TBody>
              {aging.rows.map((r) => (
                <Tr key={r.customerId}>
                  <Td className="font-medium">{r.customerName}</Td>
                  {AGING_BUCKETS.map((b) => (
                    <Td key={b} className={b === "d90_plus" && r.buckets[b] ? "text-error" : ""}>
                      {baht(r.buckets[b])}
                    </Td>
                  ))}
                  <Td className="font-semibold">{baht(r.total)}</Td>
                  <Td className="text-xs text-muted">
                    {dunned.has(r.customerId)
                      ? new Date(dunned.get(r.customerId)!).toLocaleDateString("th-TH")
                      : "—"}
                  </Td>
                  <Td>
                    <form action={recordDunningAction}>
                      <input type="hidden" name="customerId" value={r.customerId} />
                      <input type="hidden" name="amount" value={r.total} />
                      <Button type="submit" variant="secondary" size="sm">
                        <BellRing className="size-4" />
                        ส่งใบทวง
                      </Button>
                    </form>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </Container>
  );
}
