import { notFound } from "next/navigation";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { payrollTotals } from "@/src/domain/services/payroll";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";
import { PostPayrollButton } from "@/src/presentation/components/hr/PostPayrollButton";

const baht = (v: number) => `฿${formatScaled(v, 100)}`;

export default async function PayrollRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const run = await container.payrollRunRepository.findById(shopId, id);
  if (!run) notFound();

  const employees = await Promise.all(
    run.slips.map((s) => container.employeeRepository.findById(shopId, s.employeeId)),
  );
  const totals = payrollTotals(run.slips);

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บุคลากร", href: "/shop/hr" },
          { label: "เงินเดือน", href: "/shop/hr/payroll" },
          { label: run.docNumber ?? "(ร่าง)" },
        ]}
      />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{run.docNumber ?? "งวดเงินเดือน"}</h1>
        <DocumentStatusBadge status={run.status} />
      </div>
      <p className="text-muted">งวด {run.period} · ภาษีหัก ณ ที่จ่าย {(run.whtRateBp / 100).toFixed(2)}%</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="รวมเงินเดือน" value={baht(totals.gross)} />
        <StatCard label="ภาษีหัก ณ ที่จ่าย" value={baht(totals.tax)} />
        <StatCard label="จ่ายสุทธิ" value={baht(totals.net)} />
      </div>

      <Card>
        <CardBody>
          <Table>
            <THead>
              <Tr>
                <Th>พนักงาน</Th>
                <Th>เงินเดือน</Th>
                <Th>ภาษีหัก</Th>
                <Th>สุทธิ</Th>
              </Tr>
            </THead>
            <TBody>
              {run.slips.map((s, i) => (
                <Tr key={s.id}>
                  <Td>{employees[i]?.name ?? "—"}</Td>
                  <Td>{baht(s.gross)}</Td>
                  <Td>{baht(s.tax)}</Td>
                  <Td className="font-medium">{baht(s.net)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>

      {run.status === "draft" && <PostPayrollButton runId={run.id} />}
    </Container>
  );
}
