import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { GetSalesReportUseCase } from "@/src/application/use-cases/reporting/GetSalesReportUseCase";
import { formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import { percentShare } from "@/src/domain/services/reporting";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { BarChart } from "@/src/presentation/components/reporting/BarChart";

const baht = (v: number) => `฿${formatScaled(v, 100)}`;

export default async function SalesReportPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const r = await new GetSalesReportUseCase(container.reportingRepository).execute(
    shopId,
    new Date().toISOString(),
  );
  const topTotal = r.topProducts.reduce((s, p) => s + p.amount, 0);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "รายงาน", href: "/shop/reports" },
          { label: "การขาย" },
        ]}
      />
      <h1 className="text-2xl font-bold">รายงานการขาย</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="จำนวนใบแจ้งหนี้" value={String(r.summary.count)} />
        <StatCard label="ยอดขายรวม" value={baht(r.summary.total)} />
        <StatCard label="รับชำระแล้ว" value={baht(r.summary.paid)} />
      </div>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-semibold">ยอดขาย 6 เดือนล่าสุด</h2>
          <BarChart data={r.months.map((m) => ({ label: m.month, value: m.total }))} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-lg font-semibold">สินค้าขายดี 5 อันดับ</h2>
          {r.topProducts.length === 0 ? (
            <EmptyState title="ยังไม่มีข้อมูลการขาย" description="ออกใบแจ้งหนี้แล้วจะเห็นสินค้าขายดีที่นี่" />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>สินค้า</Th>
                  <Th>จำนวน</Th>
                  <Th>ยอดขาย</Th>
                  <Th>สัดส่วน</Th>
                </Tr>
              </THead>
              <TBody>
                {r.topProducts.map((p) => (
                  <Tr key={p.productId}>
                    <Td>{p.name}</Td>
                    <Td>{formatScaled(p.qty, QTY_SCALE)}</Td>
                    <Td>{baht(p.amount)}</Td>
                    <Td>{percentShare(p.amount, topTotal)}%</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </Container>
  );
}
