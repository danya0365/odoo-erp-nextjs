import { notFound } from "next/navigation";
import { Check, X, Wallet } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";
import {
  approveExpenseClaimAction,
  rejectExpenseClaimAction,
  payExpenseClaimAction,
} from "@/src/presentation/actions/expense-actions";

export default async function ExpenseClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const claim = await container.expenseClaimRepository.findById(shopId, id);
  if (!claim) notFound();
  const employee = await container.employeeRepository.findById(shopId, claim.employeeId);

  return (
    <Container className="max-w-2xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บุคลากร", href: "/shop/hr" },
          { label: "เบิกค่าใช้จ่าย", href: "/shop/hr/expenses" },
          { label: claim.docNumber },
        ]}
      />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">ใบเบิก {claim.docNumber}</h1>
        <DocumentStatusBadge status={claim.status} />
      </div>

      <Card>
        <CardBody className="space-y-1 text-sm">
          <p><span className="text-muted">พนักงาน:</span> {employee?.name ?? "—"}</p>
          <p><span className="text-muted">หมวด:</span> {claim.category}</p>
          {claim.description && <p><span className="text-muted">รายละเอียด:</span> {claim.description}</p>}
          <p className="text-lg font-bold">฿{formatScaled(claim.amount, 100)}</p>
        </CardBody>
      </Card>

      {claim.status === "submitted" && (
        <div className="flex gap-2">
          <form action={approveExpenseClaimAction}>
            <input type="hidden" name="id" value={claim.id} />
            <Button type="submit"><Check className="size-4" />อนุมัติ</Button>
          </form>
          <form action={rejectExpenseClaimAction}>
            <input type="hidden" name="id" value={claim.id} />
            <Button type="submit" variant="ghost"><X className="size-4" />ปฏิเสธ</Button>
          </form>
        </div>
      )}

      {claim.status === "approved" && (
        <form action={payExpenseClaimAction}>
          <input type="hidden" name="id" value={claim.id} />
          <Button type="submit"><Wallet className="size-4" />จ่ายคืน + ลงบัญชี</Button>
        </form>
      )}

      {claim.status === "paid" && (
        <Alert variant="success">จ่ายคืนแล้ว ฿{formatScaled(claim.amount, 100)} — ลงบัญชีค่าใช้จ่ายเรียบร้อย</Alert>
      )}
      {claim.status === "rejected" && <Alert variant="error">ใบเบิกนี้ถูกปฏิเสธ</Alert>}
    </Container>
  );
}
