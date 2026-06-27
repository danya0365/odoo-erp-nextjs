import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { TransferForm } from "@/src/presentation/components/inventory/TransferForm";

export default async function TransferPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  await container.stockLocationRepository.ensureDefault(shopId);
  const [locations, stockable, transfers] = await Promise.all([
    container.stockLocationRepository.list(shopId),
    container.productRepository.listStockable(shopId),
    container.stockMoveRepository.listBySourceType(shopId, "transfer", 20),
  ]);
  const products = stockable.map((p) => ({ id: p.id, name: p.name }));
  const productName = new Map(stockable.map((p) => [p.id, p.name]));

  // แสดงเฉพาะขา OUT (qtyDelta < 0) เป็น 1 รายการต่อการโอน
  const outMoves = transfers.filter((m) => m.qtyDelta < 0);

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "คลังสินค้า", href: "/shop/inventory" },
          { label: "โอนย้ายสต๊อก" },
        ]}
      />
      <h1 className="text-2xl font-bold">โอนย้ายสต๊อก</h1>

      <Card>
        <CardBody>
          <TransferForm products={products} locations={locations.map((l) => ({ id: l.id, name: l.name }))} />
        </CardBody>
      </Card>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">การโอนล่าสุด</h2>
        {outMoves.length === 0 ? (
          <EmptyState title="ยังไม่มีการโอน" description="โอนสต๊อกระหว่างคลังแล้วจะแสดงที่นี่" />
        ) : (
          <Card>
            <Table>
              <THead>
                <Tr>
                  <Th>วันที่</Th>
                  <Th>สินค้า</Th>
                  <Th>รายละเอียด</Th>
                  <Th>จำนวน</Th>
                </Tr>
              </THead>
              <TBody>
                {outMoves.map((m) => (
                  <Tr key={m.id}>
                    <Td>{new Date(m.createdAt).toLocaleDateString("th-TH")}</Td>
                    <Td>{productName.get(m.productId) ?? "—"}</Td>
                    <Td className="text-muted">{m.note ?? "—"}</Td>
                    <Td>{formatScaled(Math.abs(m.qtyDelta), QTY_SCALE)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </div>
    </Container>
  );
}
