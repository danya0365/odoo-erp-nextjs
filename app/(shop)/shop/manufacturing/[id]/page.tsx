import { notFound } from "next/navigation";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { componentRequirement } from "@/src/domain/services/manufacturing";
import { formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";
import { ProduceButton } from "@/src/presentation/components/manufacturing/ProduceButton";
import { confirmMoAction, cancelMoAction } from "@/src/presentation/actions/manufacturing-actions";

const qtyFmt = (v: number) => formatScaled(v, QTY_SCALE);

export default async function MoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const order = await container.manufacturingOrderRepository.findById(shopId, id);
  if (!order) notFound();

  const [bom, product] = await Promise.all([
    container.bomRepository.findById(shopId, order.bomId),
    container.productRepository.findById(shopId, order.productId),
  ]);

  const components = await Promise.all(
    (bom?.lines ?? []).map(async (l) => {
      const [comp, onHand] = await Promise.all([
        container.productRepository.findById(shopId, l.componentId),
        container.stockMoveRepository.onHandByProduct(shopId, l.componentId),
      ]);
      const required = componentRequirement(l.qtyPerUnit, order.qty);
      return { name: comp?.name ?? "—", required, onHand, enough: onHand >= required };
    }),
  );
  const allEnough = components.every((c) => c.enough);

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การผลิต", href: "/shop/manufacturing" },
          { label: order.docNumber ?? "(ร่าง)" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{order.docNumber ?? "ใบสั่งผลิต"}</h1>
          <DocumentStatusBadge status={order.status} />
        </div>
        {(order.status === "draft" || order.status === "confirmed") && (
          <form action={cancelMoAction}>
            <input type="hidden" name="id" value={order.id} />
            <Button variant="ghost" size="sm" type="submit">ยกเลิก</Button>
          </form>
        )}
      </div>

      <p className="text-muted">
        ผลิต: <span className="font-medium text-foreground">{product?.name ?? "—"}</span> · จำนวน {qtyFmt(order.qty)}
      </p>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-lg font-semibold">วัตถุดิบที่ต้องใช้</h2>
          <Table>
            <THead>
              <Tr>
                <Th>วัตถุดิบ</Th>
                <Th>ต้องใช้</Th>
                <Th>คงเหลือ</Th>
                <Th>พอ?</Th>
              </Tr>
            </THead>
            <TBody>
              {components.map((c, i) => (
                <Tr key={i}>
                  <Td>{c.name}</Td>
                  <Td>{qtyFmt(c.required)}</Td>
                  <Td>{qtyFmt(c.onHand)}</Td>
                  <Td>
                    {c.enough ? (
                      <Badge variant="success">พอ</Badge>
                    ) : (
                      <Badge variant="error">ไม่พอ</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>

      {order.status === "draft" && (
        <form action={confirmMoAction}>
          <input type="hidden" name="id" value={order.id} />
          <Button type="submit">ยืนยันใบสั่งผลิต</Button>
        </form>
      )}

      {order.status === "confirmed" && <ProduceButton orderId={order.id} disabled={!allEnough} />}
    </Container>
  );
}
