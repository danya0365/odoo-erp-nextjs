import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { PurchaseReturnForm } from "@/src/presentation/components/purchase/PurchaseReturnForm";

export default async function NewPurchaseReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ bill?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { bill: billId } = await searchParams;

  const crumb = (
    <Breadcrumb
      items={[
        { label: "ร้านค้า", href: "/shop" },
        { label: "การจัดซื้อ", href: "/shop/purchase" },
        { label: "คืนของผู้ขาย", href: "/shop/purchase/returns" },
        { label: "สร้างใบคืน" },
      ]}
    />
  );

  if (billId) {
    const billDoc = await container.vendorBillRepository.findById(shopId, billId);
    if (!billDoc) notFound();
    const lines = await container.vendorBillRepository.listLines(shopId, billId);
    const products = await Promise.all(lines.map((l) => container.productRepository.findById(shopId, l.productId)));
    const formLines = lines.map((l, i) => ({
      id: l.id,
      name: products[i]?.name ?? l.description,
      qty: l.qty,
      unitPrice: l.unitPrice,
    }));
    return (
      <Container className="max-w-3xl space-y-6 py-8">
        {crumb}
        <h1 className="text-2xl font-bold">คืนของจากใบตั้งหนี้ {billDoc.docNumber}</h1>
        <Card><CardBody><PurchaseReturnForm vendorBillId={billId} lines={formLines} /></CardBody></Card>
      </Container>
    );
  }

  const bills = await container.vendorBillRepository.listByStatuses(shopId, ["posted", "paid"]);
  const vendors = await Promise.all(bills.map((b) => container.partnerRepository.findById(shopId, b.vendorId)));

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      {crumb}
      <h1 className="text-2xl font-bold">เลือกใบตั้งหนี้ที่จะคืน</h1>
      {bills.length === 0 ? (
        <EmptyState title="ยังไม่มีใบตั้งหนี้ที่คืนได้" description="ต้องมีใบตั้งหนี้ผู้ขายที่ลงบัญชีแล้วก่อน" />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr><Th>เลขที่</Th><Th>ผู้ขาย</Th><Th>ยอดรวม</Th><Th></Th></Tr>
            </THead>
            <TBody>
              {bills.map((b, i) => (
                <Tr key={b.id}>
                  <Td className="font-medium">{b.docNumber}</Td>
                  <Td>{vendors[i]?.name ?? "—"}</Td>
                  <Td>฿{formatScaled(b.totalAmount, 100)}</Td>
                  <Td>
                    <Link href={`/shop/purchase/returns/new?bill=${b.id}`} className="font-medium text-brand-600 hover:underline">เลือก</Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </Container>
  );
}
