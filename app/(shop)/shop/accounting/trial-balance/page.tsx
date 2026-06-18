import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { GetTrialBalanceUseCase } from "@/src/application/use-cases/accounting/GetTrialBalanceUseCase";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

const TYPE_LABEL: Record<string, string> = {
  asset: "สินทรัพย์",
  liability: "หนี้สิน",
  equity: "ส่วนของเจ้าของ",
  income: "รายได้",
  expense: "ค่าใช้จ่าย",
};

export default async function TrialBalancePage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const tb = await new GetTrialBalanceUseCase(
    container.accountRepository,
    container.journalEntryRepository,
  ).execute(shopId);

  const balanced = tb.totals.debit === tb.totals.credit;

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บัญชี", href: "/shop/accounting" },
          { label: "งบทดลอง" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">งบทดลอง</h1>
        <Badge variant={balanced ? "success" : "error"}>
          {balanced ? "สมดุล ✓" : "ไม่สมดุล"}
        </Badge>
      </div>

      {tb.rows.length === 0 ? (
        <EmptyState title="ยังไม่มีรายการบัญชี" description="งบทดลองจะแสดงเมื่อมีการลงบัญชี" />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>รหัส</Th>
                <Th>บัญชี</Th>
                <Th>ประเภท</Th>
                <Th>เดบิต</Th>
                <Th>เครดิต</Th>
              </Tr>
            </THead>
            <TBody>
              {tb.rows.map((r) => (
                <Tr key={r.accountId}>
                  <Td>{r.code}</Td>
                  <Td>{r.name}</Td>
                  <Td className="text-muted">{TYPE_LABEL[r.type] ?? r.type}</Td>
                  <Td>{r.debit ? `฿${formatScaled(r.debit, 100)}` : "—"}</Td>
                  <Td>{r.credit ? `฿${formatScaled(r.credit, 100)}` : "—"}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <div className="flex justify-between gap-6 border-t border-border p-4 text-sm">
            <span className="font-semibold">กำไรสุทธิ ฿{formatScaled(tb.netProfit, 100)}</span>
            <span className="flex gap-6 font-medium">
              <span>เดบิตรวม ฿{formatScaled(tb.totals.debit, 100)}</span>
              <span>เครดิตรวม ฿{formatScaled(tb.totals.credit, 100)}</span>
            </span>
          </div>
        </Card>
      )}
    </Container>
  );
}
