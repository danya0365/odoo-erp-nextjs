import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { signedBalance } from "@/src/domain/services/accounting";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

const TYPE_LABEL: Record<string, string> = {
  asset: "สินทรัพย์",
  liability: "หนี้สิน",
  equity: "ส่วนของเจ้าของ",
  income: "รายได้",
  expense: "ค่าใช้จ่าย",
};

export default async function ChartOfAccountsPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  const accounts = await container.accountRepository.ensureDefaults(shopId);
  const tb = await container.journalEntryRepository.trialBalance(shopId);
  const balByAccount = new Map(
    tb.map((r) => [r.accountId, signedBalance(r.type, r.debit, r.credit)]),
  );

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บัญชี", href: "/shop/accounting" },
          { label: "ผังบัญชี" },
        ]}
      />
      <h1 className="text-2xl font-bold">ผังบัญชี</h1>

      <Card>
        <Table>
          <THead>
            <Tr>
              <Th>รหัส</Th>
              <Th>ชื่อบัญชี</Th>
              <Th>ประเภท</Th>
              <Th>ยอดคงเหลือ</Th>
            </Tr>
          </THead>
          <TBody>
            {accounts.map((a) => (
              <Tr key={a.id}>
                <Td>
                  <Link
                    href={`/shop/accounting/accounts/${a.id}`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {a.code}
                  </Link>
                </Td>
                <Td>{a.name}</Td>
                <Td className="text-muted">{TYPE_LABEL[a.type] ?? a.type}</Td>
                <Td>฿{formatScaled(balByAccount.get(a.id) ?? 0, 100)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </Container>
  );
}
