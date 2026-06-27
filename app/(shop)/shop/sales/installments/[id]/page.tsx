import { notFound } from "next/navigation";
import { Wallet } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled } from "@/src/domain/services/money";
import { outstandingOf } from "@/src/domain/services/installment";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";
import { payInstallmentAction } from "@/src/presentation/actions/installment-actions";

export default async function InstallmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const plan = await container.installmentPlanRepository.findById(shopId, id);
  if (!plan) notFound();
  const customer = await container.partnerRepository.findById(shopId, plan.customerId);
  const outstanding = outstandingOf(plan.lines);

  return (
    <Container className="max-w-2xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การขาย", href: "/shop/sales" },
          { label: "ผ่อนชำระ", href: "/shop/sales/installments" },
          { label: customer?.name ?? "แผน" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">แผนผ่อนชำระ — {customer?.name ?? "—"}</h1>
        <DocumentStatusBadge status={plan.status} />
      </div>
      <p className="text-sm text-muted">
        ยอดรวม ฿{formatScaled(plan.totalAmount, 100)} · คงเหลือ ฿{formatScaled(outstanding, 100)}
      </p>

      <Card>
        <Table>
          <THead>
            <Tr><Th>งวด</Th><Th>ครบกำหนด</Th><Th>จำนวน</Th><Th>สถานะ</Th><Th></Th></Tr>
          </THead>
          <TBody>
            {plan.lines.map((l) => (
              <Tr key={l.id}>
                <Td>{l.seq === 1 ? "มัดจำ" : `งวด ${l.seq}`}</Td>
                <Td className="text-muted">{new Date(l.dueDate).toLocaleDateString("th-TH")}</Td>
                <Td>฿{formatScaled(l.amount, 100)}</Td>
                <Td>
                  {l.status === "paid" ? (
                    <Badge variant="success">ชำระแล้ว</Badge>
                  ) : (
                    <Badge variant="warning">ค้างชำระ</Badge>
                  )}
                </Td>
                <Td>
                  {l.status === "pending" && (
                    <form action={payInstallmentAction}>
                      <input type="hidden" name="planId" value={plan.id} />
                      <input type="hidden" name="lineId" value={l.id} />
                      <Button type="submit" variant="secondary" size="sm">
                        <Wallet className="size-4" />
                        เก็บเงินงวดนี้
                      </Button>
                    </form>
                  )}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </Container>
  );
}
