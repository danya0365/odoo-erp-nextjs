import { FileSpreadsheet } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { monthRange } from "@/src/domain/services/tax";
import { GetVatReportUseCase } from "@/src/application/use-cases/accounting/GetVatReportUseCase";
import { fileVatReturnAction } from "@/src/presentation/actions/accounting-actions";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

const baht = (v: number) => `฿${formatScaled(v, 100)}`;

export default async function VatReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const sp = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : currentMonth();

  const { from, to } = monthRange(month);
  const [summary, filings] = await Promise.all([
    new GetVatReportUseCase(container.journalEntryRepository).execute(shopId, { from, to }),
    container.vatFilingRepository.list(shopId),
  ]);
  const filedThisPeriod = filings.find((f) => f.periodStart === month);
  const payable = summary.netPayable >= 0;

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บัญชี", href: "/shop/accounting" },
          { label: "ภาษีมูลค่าเพิ่ม (ภพ.30)" },
        ]}
      />
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="size-7 text-brand-600" />
        <h1 className="text-2xl font-bold">ภาษีมูลค่าเพิ่ม (ภพ.30)</h1>
      </div>

      {/* เลือกงวด */}
      <form className="flex items-end gap-3">
        <div>
          <label className="mb-1 block text-sm text-muted">งวดภาษี (เดือน)</label>
          <Input type="month" name="month" defaultValue={month} aria-label="งวดภาษี" />
        </div>
        <Button type="submit" variant="secondary">ดูรายงาน</Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="ภาษีขาย (output VAT)" value={baht(summary.outputVat)} />
        <StatCard label="ภาษีซื้อ (input VAT)" value={baht(summary.inputVat)} />
        <StatCard
          label={payable ? "ภาษีที่ต้องชำระ" : "ภาษีขอคืน/ยกไป"}
          value={baht(Math.abs(summary.netPayable))}
        />
      </div>

      {/* ยื่นภาษีงวดนี้ */}
      {filedThisPeriod ? (
        <Alert variant="success">
          ยื่น ภพ.30 งวด {month} แล้ว เมื่อ {new Date(filedThisPeriod.filedAt).toLocaleDateString("th-TH")}
        </Alert>
      ) : (
        <form action={fileVatReturnAction}>
          <input type="hidden" name="month" value={month} />
          <Button type="submit">
            <FileSpreadsheet className="size-4" />
            บันทึกการยื่น ภพ.30 งวด {month}
          </Button>
        </form>
      )}

      {/* ประวัติการยื่น */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">ประวัติการยื่น</h2>
        {filings.length === 0 ? (
          <EmptyState title="ยังไม่มีการยื่น" description="เลือกงวดแล้วกดบันทึกการยื่น ภพ.30" />
        ) : (
          <Card>
            <Table>
              <THead>
                <Tr>
                  <Th>งวด</Th>
                  <Th>ภาษีขาย</Th>
                  <Th>ภาษีซื้อ</Th>
                  <Th>สุทธิ</Th>
                  <Th>ยื่นเมื่อ</Th>
                </Tr>
              </THead>
              <TBody>
                {filings.map((f) => (
                  <Tr key={f.id}>
                    <Td className="font-medium">{f.periodStart}</Td>
                    <Td>{baht(f.outputVat)}</Td>
                    <Td>{baht(f.inputVat)}</Td>
                    <Td>
                      <Badge variant={f.netPayable >= 0 ? "warning" : "success"}>
                        {f.netPayable >= 0 ? "ชำระ" : "ขอคืน"} {baht(Math.abs(f.netPayable))}
                      </Badge>
                    </Td>
                    <Td className="text-muted">{new Date(f.filedAt).toLocaleDateString("th-TH")}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </section>
    </Container>
  );
}
