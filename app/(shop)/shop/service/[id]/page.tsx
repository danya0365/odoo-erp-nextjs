import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Receipt } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";
import { AssignForm } from "@/src/presentation/components/service/ServiceForms";
import { closeServiceTicketAction } from "@/src/presentation/actions/service-actions";

export default async function ServiceTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const ticket = await container.serviceTicketRepository.findById(shopId, id);
  if (!ticket) notFound();
  const [customer, assignee, employees] = await Promise.all([
    container.partnerRepository.findById(shopId, ticket.customerId),
    ticket.assigneeId ? container.employeeRepository.findById(shopId, ticket.assigneeId) : Promise.resolve(null),
    container.employeeRepository.listActive(shopId),
  ]);

  return (
    <Container className="max-w-2xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "งานบริการ/ซ่อม", href: "/shop/service" },
          { label: ticket.docNumber },
        ]}
      />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">ใบงาน {ticket.docNumber}</h1>
        <DocumentStatusBadge status={ticket.status} />
      </div>

      <Card>
        <CardBody className="space-y-1 text-sm">
          <p><span className="text-muted">ลูกค้า:</span> {customer?.name ?? "—"}</p>
          <p><span className="text-muted">เรื่อง:</span> {ticket.subject}</p>
          {ticket.description && <p><span className="text-muted">รายละเอียด:</span> {ticket.description}</p>}
          {assignee && <p><span className="text-muted">ช่างผู้รับผิดชอบ:</span> {assignee.name}</p>}
          {ticket.scheduledAt && <p><span className="text-muted">นัดหมาย:</span> {new Date(ticket.scheduledAt).toLocaleString("th-TH")}</p>}
        </CardBody>
      </Card>

      {(ticket.status === "open" || ticket.status === "assigned") && (
        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-semibold">มอบหมายช่าง + นัดหมาย</h2>
            <AssignForm id={ticket.id} employees={employees.map((e) => ({ id: e.id, name: e.name }))} />
          </CardBody>
        </Card>
      )}

      {ticket.status === "assigned" && (
        <div className="flex flex-wrap gap-2">
          <form action={closeServiceTicketAction}>
            <input type="hidden" name="id" value={ticket.id} />
            <Button type="submit"><CheckCircle2 className="size-4" />ปิดงาน (เสร็จสิ้น)</Button>
          </form>
          <Link href="/shop/sales/new">
            <Button variant="secondary"><Receipt className="size-4" />ออกใบขาย/เก็บเงิน</Button>
          </Link>
        </div>
      )}

      {ticket.status === "done" && <Alert variant="success">งานเสร็จสิ้นแล้ว — ออกใบขายเก็บเงินได้ที่เมนูการขาย</Alert>}
    </Container>
  );
}
