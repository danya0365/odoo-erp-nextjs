import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { container } from "@/src/infrastructure/di/container";
import { formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const shop = await container.shopRepository.findBySlug(slug);
  if (!shop) notFound();

  const order = await container.onlineOrderRepository.findById(shop.id, id);
  if (!order) notFound();
  const salesOrder = await container.salesOrderRepository.findById(shop.id, order.salesOrderId);

  return (
    <Container className="max-w-2xl space-y-6 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="size-12 text-success" />
        <h1 className="text-2xl font-bold">ขอบคุณสำหรับการสั่งซื้อ</h1>
        <p className="text-muted">
          เลขที่ออร์เดอร์ <span className="font-medium text-foreground">{order.orderNumber}</span>
        </p>
      </div>

      <Card>
        <CardBody className="space-y-3">
          <p className="text-sm text-muted">ผู้สั่งซื้อ: {order.customerName} · {order.email}</p>
          <Table>
            <THead>
              <Tr>
                <Th>สินค้า</Th>
                <Th>จำนวน</Th>
                <Th>รวม</Th>
              </Tr>
            </THead>
            <TBody>
              {(salesOrder?.lines ?? []).map((l) => (
                <Tr key={l.id}>
                  <Td>{l.description}</Td>
                  <Td>{formatScaled(l.qtyOrdered, QTY_SCALE)}</Td>
                  <Td>฿{formatScaled(l.lineTotal, 100)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <p className="text-right text-lg font-bold">รวมทั้งสิ้น ฿{formatScaled(order.totalAmount, 100)}</p>
        </CardBody>
      </Card>

      <div className="text-center">
        <Link href={`/store/${slug}`}>
          <Button variant="secondary">เลือกซื้อต่อ</Button>
        </Link>
      </div>
    </Container>
  );
}
