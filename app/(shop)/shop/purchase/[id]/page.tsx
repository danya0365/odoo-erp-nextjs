import { notFound } from "next/navigation";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";
import { ReceiveForm } from "@/src/presentation/components/purchase/ReceiveForm";
import { BillPaymentForm } from "@/src/presentation/components/purchase/BillPaymentForm";
import {
  confirmPurchaseOrderAction,
  createVendorBillAction,
  cancelPurchaseOrderAction,
} from "@/src/presentation/actions/purchase-actions";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const order = await container.purchaseOrderRepository.findById(shopId, id);
  if (!order) notFound();

  const [vendor, bills] = await Promise.all([
    container.partnerRepository.findById(shopId, order.vendorId),
    container.vendorBillRepository.listByPurchaseOrder(shopId, id),
  ]);
  const bill = bills[0] ?? null;

  const receiveLines = order.lines.map((l) => ({
    id: l.id,
    productName: l.description,
    remaining: l.qtyOrdered - l.qtyReceived,
    uom: "หน่วย",
  }));

  return (
    <Container className="max-w-4xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การจัดซื้อ", href: "/shop/purchase" },
          { label: order.docNumber ?? "(ขอราคา)" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{order.docNumber ?? "ใบขอราคา"}</h1>
          <DocumentStatusBadge status={order.status} />
        </div>
        {(order.status === "rfq" || order.status === "confirmed") && (
          <form action={cancelPurchaseOrderAction}>
            <input type="hidden" name="id" value={order.id} />
            <Button variant="ghost" size="sm" type="submit">ยกเลิก</Button>
          </form>
        )}
      </div>

      <p className="text-muted">ผู้ขาย: {vendor?.name ?? "—"}</p>

      <Card>
        <CardBody>
          <Table>
            <THead>
              <Tr>
                <Th>สินค้า</Th>
                <Th>สั่ง</Th>
                <Th>รับแล้ว</Th>
                <Th>ราคาทุน/หน่วย</Th>
                <Th>รวม</Th>
              </Tr>
            </THead>
            <TBody>
              {order.lines.map((l) => (
                <Tr key={l.id}>
                  <Td>{l.description}</Td>
                  <Td>{formatScaled(l.qtyOrdered, QTY_SCALE)}</Td>
                  <Td>{formatScaled(l.qtyReceived, QTY_SCALE)}</Td>
                  <Td>฿{formatScaled(l.unitPrice, 100)}</Td>
                  <Td>฿{formatScaled(l.lineTotal, 100)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <div className="mt-4 flex flex-col items-end gap-1 text-sm">
            <span className="text-muted">ก่อนภาษี ฿{formatScaled(order.untaxedAmount, 100)}</span>
            <span className="text-muted">ภาษี ฿{formatScaled(order.taxAmount, 100)}</span>
            <span className="text-lg font-semibold">รวม ฿{formatScaled(order.totalAmount, 100)}</span>
          </div>
        </CardBody>
      </Card>

      {order.status === "rfq" && (
        <form action={confirmPurchaseOrderAction}>
          <input type="hidden" name="id" value={order.id} />
          <Button type="submit">ยืนยันใบสั่งซื้อ</Button>
        </form>
      )}

      {(order.status === "confirmed" || order.status === "partially_received") && (
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-lg font-semibold">รับของ</h2>
            <ReceiveForm orderId={order.id} lines={receiveLines} />
          </CardBody>
        </Card>
      )}

      {order.status === "received" && (
        <form action={createVendorBillAction}>
          <input type="hidden" name="id" value={order.id} />
          <Button type="submit">ตั้งหนี้ผู้ขาย</Button>
        </form>
      )}

      {bill && (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">ใบตั้งหนี้ {bill.docNumber}</h2>
              <DocumentStatusBadge status={bill.status} />
            </div>
            <p className="text-sm text-muted">
              ยอด ฿{formatScaled(bill.totalAmount, 100)} · จ่ายแล้ว ฿
              {formatScaled(bill.amountPaid, 100)}
            </p>
            {bill.status !== "paid" && (
              <BillPaymentForm
                orderId={order.id}
                billId={bill.id}
                amountDue={formatScaled(bill.totalAmount - bill.amountPaid, 100)}
              />
            )}
          </CardBody>
        </Card>
      )}
    </Container>
  );
}
