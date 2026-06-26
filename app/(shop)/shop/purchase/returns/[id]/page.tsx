import { notFound } from "next/navigation";
import { PackageX } from "lucide-react";

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
import { confirmPurchaseReturnAction } from "@/src/presentation/actions/purchase-return-actions";

export default async function PurchaseReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const ret = await container.purchaseReturnRepository.findById(shopId, id);
  if (!ret) notFound();
  const vendor = await container.partnerRepository.findById(shopId, ret.vendorId);

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การจัดซื้อ", href: "/shop/purchase" },
          { label: "คืนของผู้ขาย", href: "/shop/purchase/returns" },
          { label: ret.docNumber },
        ]}
      />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">ใบคืนของผู้ขาย {ret.docNumber}</h1>
        <DocumentStatusBadge status={ret.status} />
      </div>

      <Card>
        <CardBody className="space-y-1 text-sm">
          <p><span className="text-muted">ผู้ขาย:</span> {vendor?.name ?? "—"}</p>
          {ret.reason && <p><span className="text-muted">ผล QC / เหตุผล:</span> {ret.reason}</p>}
          <p><span className="text-muted">วันที่:</span> {new Date(ret.createdAt).toLocaleDateString("th-TH")}</p>
        </CardBody>
      </Card>

      <Card>
        <Table>
          <THead>
            <Tr><Th>สินค้า</Th><Th>จำนวน</Th><Th>ราคา/หน่วย</Th><Th>รวม</Th></Tr>
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

      {ret.status === "draft" ? (
        <form action={confirmPurchaseReturnAction}>
          <input type="hidden" name="id" value={ret.id} />
          <Button type="submit">
            <PackageX className="size-4" />
            ยืนยันคืนของ (ส่งของออก + ออกใบลดหนี้ผู้ขาย)
          </Button>
        </form>
      ) : (
        <Alert variant="success">ออกใบลดหนี้ผู้ขายแล้ว — ลดยอดเจ้าหนี้ ฿{formatScaled(ret.totalAmount, 100)}</Alert>
      )}
    </Container>
  );
}
