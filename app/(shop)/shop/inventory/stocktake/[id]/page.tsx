import { notFound } from "next/navigation";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";
import { StocktakeForm } from "@/src/presentation/components/inventory/StocktakeForm";

export default async function StocktakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const sc = await container.stockCountRepository.findById(shopId, id);
  if (!sc) notFound();
  const products = await Promise.all(
    sc.lines.map((l) => container.productRepository.findById(shopId, l.productId)),
  );
  const formLines = sc.lines.map((l, i) => ({
    id: l.id,
    name: products[i]?.name ?? l.productId,
    systemQty: l.systemQty,
    countedQty: l.countedQty,
  }));

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "คลังสินค้า", href: "/shop/inventory" },
          { label: "ตรวจนับสต๊อก", href: "/shop/inventory/stocktake" },
          { label: sc.docNumber },
        ]}
      />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">รอบตรวจนับ {sc.docNumber}</h1>
        <DocumentStatusBadge status={sc.status} />
      </div>

      {sc.status === "draft" ? (
        <Card>
          <CardBody>
            <p className="mb-3 text-sm text-muted">กรอกยอดนับจริง แล้วยืนยันเพื่อปรับสต๊อกตามส่วนต่าง</p>
            <StocktakeForm id={sc.id} lines={formLines} />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>สินค้า</Th>
                <Th>ยอดระบบ (ตอนเปิด)</Th>
                <Th>นับได้จริง</Th>
                <Th>ส่วนต่าง</Th>
              </Tr>
            </THead>
            <TBody>
              {sc.lines.map((l, i) => {
                const diff = l.countedQty - l.systemQty;
                return (
                  <Tr key={l.id}>
                    <Td>{products[i]?.name ?? l.productId}</Td>
                    <Td className="text-muted">{formatScaled(l.systemQty, 1000)}</Td>
                    <Td>{formatScaled(l.countedQty, 1000)}</Td>
                    <Td className={diff === 0 ? "text-muted" : diff > 0 ? "text-success" : "text-error"}>
                      {diff > 0 ? "+" : ""}{formatScaled(diff, 1000)}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}
    </Container>
  );
}
