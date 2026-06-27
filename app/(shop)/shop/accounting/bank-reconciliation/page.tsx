import { Landmark } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { GetTrialBalanceUseCase } from "@/src/application/use-cases/accounting/GetTrialBalanceUseCase";
import { ACCOUNT_CODES, signedBalance } from "@/src/domain/services/accounting";
import { reconcileBankLineAction } from "@/src/presentation/actions/bank-actions";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Button } from "@/src/presentation/components/ui/Button";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { BankImportForm } from "@/src/presentation/components/accounting/BankImportForm";

const baht = (v: number) => `฿${formatScaled(v, 100)}`;

export default async function BankReconciliationPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  const [lines, tb] = await Promise.all([
    container.bankStatementRepository.list(shopId),
    new GetTrialBalanceUseCase(container.accountRepository, container.journalEntryRepository).execute(shopId),
  ]);
  const cashRow = tb.rows.find((r) => r.code === ACCOUNT_CODES.cash);
  const bookCash = cashRow ? signedBalance(cashRow.type, cashRow.debit, cashRow.credit) : 0;
  const reconciledTotal = lines.filter((l) => l.reconciled).reduce((s, l) => s + l.amount, 0);
  const unreconciled = lines.filter((l) => !l.reconciled).length;

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บัญชี", href: "/shop/accounting" },
          { label: "กระทบยอดธนาคาร" },
        ]}
      />
      <div className="flex items-center gap-3">
        <Landmark className="size-7 text-brand-600" />
        <h1 className="text-2xl font-bold">กระทบยอดธนาคาร</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="เงินสด/ธนาคารตามสมุด" value={baht(bookCash)} />
        <StatCard label="ยอดที่กระทบแล้ว" value={baht(reconciledTotal)} />
        <StatCard label="รายการที่ยังไม่กระทบ" value={String(unreconciled)} />
      </div>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="font-semibold">นำเข้ารายการเดินบัญชี</h2>
          <BankImportForm />
        </CardBody>
      </Card>

      {lines.length === 0 ? (
        <EmptyState title="ยังไม่มีรายการเดินบัญชี" description="นำเข้ารายการจากธนาคารเพื่อกระทบยอด" />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr><Th>วันที่</Th><Th>รายละเอียด</Th><Th>จำนวน</Th><Th>สถานะ</Th><Th></Th></Tr>
            </THead>
            <TBody>
              {lines.map((l) => (
                <Tr key={l.id}>
                  <Td className="text-muted">{new Date(l.statementDate).toLocaleDateString("th-TH")}</Td>
                  <Td>{l.description || "—"}</Td>
                  <Td className={l.amount < 0 ? "text-error" : "text-success"}>{baht(l.amount)}</Td>
                  <Td>
                    {l.reconciled ? <Badge variant="success">กระทบแล้ว</Badge> : <Badge variant="warning">ยังไม่กระทบ</Badge>}
                  </Td>
                  <Td>
                    <form action={reconcileBankLineAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="reconciled" value={l.reconciled ? "false" : "true"} />
                      <Button type="submit" variant="ghost" size="sm">
                        {l.reconciled ? "ยกเลิก" : "กระทบยอด"}
                      </Button>
                    </form>
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
