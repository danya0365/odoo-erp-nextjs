import { notFound } from "next/navigation";
import { Undo2, RotateCcw } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";
import {
  confirmSalesReturnAction,
  refundSalesReturnAction,
} from "@/src/presentation/actions/sales-return-actions";

export default async function SalesReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const ret = await container.salesReturnRepository.findById(shopId, id);
  if (!ret) notFound();
  const customer = await container.partnerRepository.findById(shopId, ret.customerId);

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การขาย", href: "/shop/sales" },
          { label: "คืนสินค้า/ใบลดหนี้", href: "/shop/sales/returns" },
          { label: ret.docNumber },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">ใบคืนสินค้า {ret.docNumber}</h1>
          <DocumentStatusBadge status={ret.status} />
        </div>
      </div>

      <Card>
        <CardBody className="space-y-1 text-sm">
          <p><span className="text-muted">ลูกค้า:</span> {customer?.name ?? "—"}</p>
          {ret.reason && <p><span className="text-muted">เหตุผล:</span> {ret.reason}</p>}
          <p><span className="text-muted">วันที่:</span> {new Date(ret.createdAt).toLocaleDateString("th-TH")}</p>
        </CardBody>
      </Card>

      <Card>
        <Table>
          <THead>
            <Tr>
              <Th>สินค้า</Th>
              <Th>จำนวน</Th>
              <Th>ราคา/หน่วย</Th>
              <Th>รวม</Th>
            </Tr>
          </THead>
          <TBody>
            {ret.lines.map((l) => (
              <Tr key={l.id}>
                <Td>{l.description}</Td>
                <Td>{formatScaled(l.qty, 1000)}</Td>
                <Td>฿{formatScaled(l.unitPrice, 100)}</Td>
                <Td>฿{formatScaled(l.lineTotal, 100)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted">ก่อนภาษี</span><span>฿{formatScaled(ret.untaxedAmount, 100)}</span></div>
          <div className="flex justify-between"><span className="text-muted">ภาษี</span><span>฿{formatScaled(ret.taxAmount, 100)}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>ยอดคืนรวม</span><span>฿{formatScaled(ret.totalAmount, 100)}</span></div>
        </div>
      </div>

      {/* แผง action ตามสถานะ */}
      {ret.status === "draft" && (
        <form action={confirmSalesReturnAction}>
          <input type="hidden" name="id" value={ret.id} />
          <Button type="submit">
            <Undo2 className="size-4" />
            ยืนยันคืน (รับของเข้าสต๊อก + ออกใบลดหนี้)
          </Button>
        </form>
      )}

      {ret.status === "credited" && (
        <form action={refundSalesReturnAction}>
          <input type="hidden" name="id" value={ret.id} />
          <Button type="submit">
            <RotateCcw className="size-4" />
            คืนเงินลูกค้า ฿{formatScaled(ret.totalAmount, 100)}
          </Button>
        </form>
      )}

      {ret.status === "refunded" && (
        <Alert variant="success">คืนเงินลูกค้าแล้ว ฿{formatScaled(ret.refundedAmount, 100)}</Alert>
      )}
    </Container>
  );
}
