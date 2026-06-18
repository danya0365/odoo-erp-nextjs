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
import { DeliverForm } from "@/src/presentation/components/sales/DeliverForm";
import { PaymentForm } from "@/src/presentation/components/sales/PaymentForm";
import {
  confirmSalesOrderAction,
  invoiceSalesOrderAction,
  cancelSalesOrderAction,
} from "@/src/presentation/actions/sales-actions";

export default async function SalesOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const order = await container.salesOrderRepository.findById(shopId, id);
  if (!order) notFound();

  const [customer, invoices] = await Promise.all([
    container.partnerRepository.findById(shopId, order.customerId),
    container.invoiceRepository.listBySalesOrder(shopId, id),
  ]);
  const invoice = invoices[0] ?? null;

  const deliverLines = order.lines.map((l) => ({
    id: l.id,
    productName: l.description,
    remaining: l.qtyOrdered - l.qtyDelivered,
    uom: "หน่วย",
  }));

  return (
    <Container className="max-w-4xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การขาย", href: "/shop/sales" },
          { label: order.docNumber ?? "(ร่าง)" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{order.docNumber ?? "ใบเสนอราคา (ร่าง)"}</h1>
          <DocumentStatusBadge status={order.status} />
        </div>
        {(order.status === "draft" || order.status === "confirmed") && (
          <form action={cancelSalesOrderAction}>
            <input type="hidden" name="id" value={order.id} />
            <Button variant="ghost" size="sm" type="submit">ยกเลิก</Button>
          </form>
        )}
      </div>

      <p className="text-muted">ลูกค้า: {customer?.name ?? "—"}</p>

      <Card>
        <CardBody>
          <Table>
            <THead>
              <Tr>
                <Th>สินค้า</Th>
                <Th>สั่ง</Th>
                <Th>ส่งแล้ว</Th>
                <Th>ราคา/หน่วย</Th>
                <Th>รวม</Th>
              </Tr>
            </THead>
            <TBody>
              {order.lines.map((l) => (
                <Tr key={l.id}>
                  <Td>{l.description}</Td>
                  <Td>{formatScaled(l.qtyOrdered, QTY_SCALE)}</Td>
                  <Td>{formatScaled(l.qtyDelivered, QTY_SCALE)}</Td>
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

      {/* แผง action ตามสถานะ */}
      {order.status === "draft" && (
        <form action={confirmSalesOrderAction}>
          <input type="hidden" name="id" value={order.id} />
          <Button type="submit">ยืนยันใบขาย</Button>
        </form>
      )}

      {(order.status === "confirmed" || order.status === "partially_delivered") && (
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-lg font-semibold">ส่งของ</h2>
            <DeliverForm orderId={order.id} lines={deliverLines} />
          </CardBody>
        </Card>
      )}

      {order.status === "delivered" && (
        <form action={invoiceSalesOrderAction}>
          <input type="hidden" name="id" value={order.id} />
          <Button type="submit">ออกใบแจ้งหนี้</Button>
        </form>
      )}

      {invoice && (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">ใบแจ้งหนี้ {invoice.docNumber}</h2>
              <DocumentStatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-muted">
              ยอด ฿{formatScaled(invoice.totalAmount, 100)} · ชำระแล้ว ฿
              {formatScaled(invoice.amountPaid, 100)}
            </p>
            {invoice.status !== "paid" && (
              <PaymentForm
                orderId={order.id}
                invoiceId={invoice.id}
                amountDue={formatScaled(invoice.totalAmount - invoice.amountPaid, 100)}
              />
            )}
          </CardBody>
        </Card>
      )}
    </Container>
  );
}
