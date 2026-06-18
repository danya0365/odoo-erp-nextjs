import { notFound } from "next/navigation";
import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { totalsOf } from "@/src/domain/services/accounting";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";

export default async function JournalEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const entry = await container.journalEntryRepository.findById(shopId, id);
  if (!entry) notFound();

  const accounts = await container.accountRepository.list(shopId);
  const accById = new Map(accounts.map((a) => [a.id, a]));
  const totals = totalsOf(entry.lines);

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บัญชี", href: "/shop/accounting" },
          { label: "สมุดรายวัน", href: "/shop/accounting/entries" },
          { label: entry.docNumber },
        ]}
      />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{entry.docNumber}</h1>
        <DocumentStatusBadge status={entry.status} />
      </div>
      <p className="text-muted">
        วันที่ {new Date(entry.date).toLocaleDateString("th-TH")}
        {entry.ref ? ` · อ้างอิง ${entry.ref}` : ""}
      </p>

      <Card>
        <Table>
          <THead>
            <Tr>
              <Th>บัญชี</Th>
              <Th>คำอธิบาย</Th>
              <Th>เดบิต</Th>
              <Th>เครดิต</Th>
            </Tr>
          </THead>
          <TBody>
            {entry.lines.map((l) => {
              const acc = accById.get(l.accountId);
              return (
                <Tr key={l.id}>
                  <Td>
                    {acc ? (
                      <Link
                        href={`/shop/accounting/accounts/${acc.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {acc.code} · {acc.name}
                      </Link>
                    ) : (
                      l.accountId
                    )}
                  </Td>
                  <Td>{l.label}</Td>
                  <Td>{l.debit ? `฿${formatScaled(l.debit, 100)}` : "—"}</Td>
                  <Td>{l.credit ? `฿${formatScaled(l.credit, 100)}` : "—"}</Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
        <div className="flex justify-end gap-6 border-t border-border p-4 text-sm font-medium">
          <span>เดบิตรวม ฿{formatScaled(totals.debit, 100)}</span>
          <span>เครดิตรวม ฿{formatScaled(totals.credit, 100)}</span>
        </div>
      </Card>
    </Container>
  );
}
