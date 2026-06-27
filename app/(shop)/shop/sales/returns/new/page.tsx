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
import { ReturnForm } from "@/src/presentation/components/sales/ReturnForm";

export default async function NewSalesReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { invoice: invoiceId } = await searchParams;

  const crumb = (
    <Breadcrumb
      items={[
        { label: "ร้านค้า", href: "/shop" },
        { label: "การขาย", href: "/shop/sales" },
        { label: "คืนสินค้า/ใบลดหนี้", href: "/shop/sales/returns" },
        { label: "สร้างใบคืน" },
      ]}
    />
  );

  // ── ขั้นที่ 2: เลือกใบแจ้งหนี้แล้ว → ฟอร์มคืนสินค้า ──
  if (invoiceId) {
    const invoice = await container.invoiceRepository.findById(shopId, invoiceId);
    if (!invoice) notFound();
    const lines = await container.invoiceRepository.listLines(shopId, invoiceId);
    const products = await Promise.all(
      lines.map((l) => container.productRepository.findById(shopId, l.productId)),
    );
    const formLines = lines.map((l, i) => ({
      id: l.id,
      name: products[i]?.name ?? l.description,
      qty: l.qty,
      unitPrice: l.unitPrice,
    }));

    return (
      <Container className="max-w-3xl space-y-6 py-8">
        {crumb}
        <h1 className="text-2xl font-bold">คืนสินค้าจากใบแจ้งหนี้ {invoice.docNumber}</h1>
        <Card>
          <CardBody>
            <ReturnForm invoiceId={invoiceId} lines={formLines} />
          </CardBody>
        </Card>
      </Container>
    );
  }

  // ── ขั้นที่ 1: เลือกใบแจ้งหนี้ที่จะคืน (เฉพาะที่ลงบัญชี/ชำระแล้ว) ──
  const invoices = await container.invoiceRepository.listByStatuses(shopId, ["posted", "paid"]);
  const customers = await Promise.all(
    invoices.map((i) => container.partnerRepository.findById(shopId, i.customerId)),
  );

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      {crumb}
      <h1 className="text-2xl font-bold">เลือกใบแจ้งหนี้ที่จะคืน</h1>
      {invoices.length === 0 ? (
        <EmptyState
          title="ยังไม่มีใบแจ้งหนี้ที่คืนได้"
          description="ต้องมีใบแจ้งหนี้ที่ลงบัญชีแล้วก่อน จึงจะออกใบคืน/ใบลดหนี้ได้"
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>เลขที่</Th>
                <Th>ลูกค้า</Th>
                <Th>ยอดรวม</Th>
                <Th></Th>
              </Tr>
            </THead>
            <TBody>
              {invoices.map((inv, i) => (
                <Tr key={inv.id}>
                  <Td className="font-medium">{inv.docNumber}</Td>
                  <Td>{customers[i]?.name ?? "—"}</Td>
                  <Td>฿{formatScaled(inv.totalAmount, 100)}</Td>
                  <Td>
                    <Link
                      href={`/shop/sales/returns/new?invoice=${inv.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      เลือก
                    </Link>
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
