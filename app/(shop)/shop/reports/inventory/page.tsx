import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { GetInventoryValuationUseCase } from "@/src/application/use-cases/reporting/GetInventoryValuationUseCase";
import { formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

const baht = (v: number) => `฿${formatScaled(v, 100)}`;

export default async function InventoryReportPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const r = await new GetInventoryValuationUseCase(container.reportingRepository).execute(shopId);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "รายงาน", href: "/shop/reports" },
          { label: "สินค้าคงคลัง" },
        ]}
      />
      <h1 className="text-2xl font-bold">มูลค่าสินค้าคงคลัง</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="รายการสินค้า" value={String(r.items.length)} />
        <StatCard label="มูลค่ารวม" value={baht(r.totalValue)} />
        <StatCard label="หมดสต๊อก" value={String(r.outOfStock)} />
      </div>

      {r.items.length === 0 ? (
        <EmptyState title="ยังไม่มีสินค้าแบบนับสต๊อก" description="เพิ่มสินค้าประเภท stockable เพื่อตีมูลค่า" />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>สินค้า</Th>
                <Th>คงเหลือ</Th>
                <Th>ต้นทุน/หน่วย</Th>
                <Th>มูลค่า</Th>
              </Tr>
            </THead>
            <TBody>
              {r.items.map((i) => (
                <Tr key={i.productId}>
                  <Td>{i.name}</Td>
                  <Td>
                    {formatScaled(i.onHand, QTY_SCALE)}
                    {i.onHand <= 0 && (
                      <Badge variant="warning" className="ml-2">หมด</Badge>
                    )}
                  </Td>
                  <Td>{baht(i.unitCost)}</Td>
                  <Td className="font-medium">{baht(i.value)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <div className="flex justify-end border-t border-border p-4 text-sm font-semibold">
            มูลค่ารวม {baht(r.totalValue)}
          </div>
        </Card>
      )}
    </Container>
  );
}
