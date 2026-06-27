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
import { InstallmentForm } from "@/src/presentation/components/sales/InstallmentForm";

export default async function NewInstallmentPage({
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
        { label: "ผ่อนชำระ", href: "/shop/sales/installments" },
        { label: "ตั้งแผนใหม่" },
      ]}
    />
  );

  if (invoiceId) {
    const invoice = await container.invoiceRepository.findById(shopId, invoiceId);
    if (!invoice) notFound();
    return (
      <Container className="max-w-2xl space-y-6 py-8">
        {crumb}
        <h1 className="text-2xl font-bold">ตั้งแผนผ่อนชำระ — {invoice.docNumber} (฿{formatScaled(invoice.totalAmount, 100)})</h1>
        <Card><CardBody><InstallmentForm invoiceId={invoiceId} /></CardBody></Card>
      </Container>
    );
  }

  const invoices = await container.invoiceRepository.listByStatuses(shopId, ["posted"]);
  const customers = await Promise.all(invoices.map((i) => container.partnerRepository.findById(shopId, i.customerId)));

  return (
    <Container className="max-w-2xl space-y-6 py-8">
      {crumb}
      <h1 className="text-2xl font-bold">เลือกใบแจ้งหนี้ที่จะผ่อน</h1>
      {invoices.length === 0 ? (
        <EmptyState title="ไม่มีใบแจ้งหนี้ที่ค้างชำระ" description="ต้องมีใบแจ้งหนี้ที่ยังไม่ชำระครบก่อน" />
      ) : (
        <Card>
          <Table>
            <THead><Tr><Th>เลขที่</Th><Th>ลูกค้า</Th><Th>ยอด</Th><Th></Th></Tr></THead>
            <TBody>
              {invoices.map((inv, i) => (
                <Tr key={inv.id}>
                  <Td className="font-medium">{inv.docNumber}</Td>
                  <Td>{customers[i]?.name ?? "—"}</Td>
                  <Td>฿{formatScaled(inv.totalAmount, 100)}</Td>
                  <Td><Link href={`/shop/sales/installments/new?invoice=${inv.id}`} className="font-medium text-brand-600 hover:underline">เลือก</Link></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </Container>
  );
}
