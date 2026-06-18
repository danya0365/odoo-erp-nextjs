import { notFound } from "next/navigation";
import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { GetGeneralLedgerUseCase } from "@/src/application/use-cases/accounting/GetGeneralLedgerUseCase";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

export default async function AccountLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const accounts = await container.accountRepository.list(shopId);
  const account = accounts.find((a) => a.id === id);
  if (!account) notFound();

  const ledger = await new GetGeneralLedgerUseCase(
    container.journalEntryRepository,
  ).execute(shopId, id);

  return (
    <Container className="max-w-4xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บัญชี", href: "/shop/accounting" },
          { label: "ผังบัญชี", href: "/shop/accounting/accounts" },
          { label: `${account.code} ${account.name}` },
        ]}
      />
      <h1 className="text-2xl font-bold">
        {account.code} · {account.name}
      </h1>

      {ledger.rows.length === 0 ? (
        <EmptyState title="ยังไม่มีรายการในบัญชีนี้" description="บัญชีจะมีรายการเมื่อมีการลงบัญชี" />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>วันที่</Th>
                <Th>เลขที่</Th>
                <Th>คำอธิบาย</Th>
                <Th>เดบิต</Th>
                <Th>เครดิต</Th>
                <Th>คงเหลือ</Th>
              </Tr>
            </THead>
            <TBody>
              {ledger.rows.map((r, i) => (
                <Tr key={`${r.entryId}-${i}`}>
                  <Td>{new Date(r.date).toLocaleDateString("th-TH")}</Td>
                  <Td>
                    <Link
                      href={`/shop/accounting/entries/${r.entryId}`}
                      className="text-brand-600 hover:underline"
                    >
                      {r.docNumber}
                    </Link>
                  </Td>
                  <Td>{r.label}{r.ref ? ` · ${r.ref}` : ""}</Td>
                  <Td>{r.debit ? `฿${formatScaled(r.debit, 100)}` : "—"}</Td>
                  <Td>{r.credit ? `฿${formatScaled(r.credit, 100)}` : "—"}</Td>
                  <Td className="font-medium">฿{formatScaled(r.balance, 100)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <div className="flex justify-end gap-6 border-t border-border p-4 text-sm">
            <span className="text-muted">เดบิตรวม ฿{formatScaled(ledger.totals.debit, 100)}</span>
            <span className="text-muted">เครดิตรวม ฿{formatScaled(ledger.totals.credit, 100)}</span>
          </div>
        </Card>
      )}
    </Container>
  );
}
