import { Check, X } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled } from "@/src/domain/services/money";
import { decideLeaveAction } from "@/src/presentation/actions/timeoff-actions";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";
import { AttendanceForm, LeaveForm } from "@/src/presentation/components/hr/TimeoffForms";

const LEAVE_LABEL: Record<string, string> = { sick: "ลาป่วย", personal: "ลากิจ", vacation: "ลาพักร้อน" };
const hrs = (v: number) => `${formatScaled(v, 100)} ชม.`;

export default async function TimeoffPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  const [employees, attendance, leaves] = await Promise.all([
    container.employeeRepository.listActive(shopId),
    container.attendanceRepository.list(shopId),
    container.leaveRequestRepository.list(shopId),
  ]);
  const empName = new Map(employees.map((e) => [e.id, e.name]));
  const options = employees.map((e) => ({ id: e.id, name: e.name }));
  // สรุปชั่วโมง/OT ต่อพนักงาน (อ้างอิงเข้าเงินเดือน)
  const summary = new Map<string, { hours: number; ot: number }>();
  for (const a of attendance) {
    const s = summary.get(a.employeeId) ?? { hours: 0, ot: 0 };
    s.hours += a.hoursWorked;
    s.ot += a.otHours;
    summary.set(a.employeeId, s);
  }

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "บุคลากร", href: "/shop/hr" }, { label: "ลงเวลา/การลา" }]} />
      <h1 className="text-2xl font-bold">ลงเวลา / การลา / OT</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-semibold">ลงเวลาทำงาน / OT</h2>
            {options.length === 0 ? <EmptyState title="ยังไม่มีพนักงาน" description="เพิ่มพนักงานก่อน" /> : <AttendanceForm employees={options} />}
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-semibold">ยื่นขอลา</h2>
            {options.length === 0 ? <EmptyState title="ยังไม่มีพนักงาน" description="เพิ่มพนักงานก่อน" /> : <LeaveForm employees={options} />}
          </CardBody>
        </Card>
      </div>

      {/* สรุปชั่วโมงต่อพนักงาน (อ้างอิงเข้าเงินเดือน) */}
      {summary.size > 0 && (
        <Card>
          <CardBody className="space-y-2">
            <h2 className="font-semibold">สรุปชั่วโมงต่อพนักงาน (ใช้อ้างอิงเข้าเงินเดือน)</h2>
            <Table>
              <THead><Tr><Th>พนักงาน</Th><Th>ชั่วโมงรวม</Th><Th>OT รวม</Th></Tr></THead>
              <TBody>
                {[...summary.entries()].map(([eid, s]) => (
                  <Tr key={eid}>
                    <Td>{empName.get(eid) ?? "—"}</Td>
                    <Td>{hrs(s.hours)}</Td>
                    <Td className="text-brand-600">{hrs(s.ot)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* คำขอลา + อนุมัติ */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">คำขอลา</h2>
        {leaves.length === 0 ? (
          <EmptyState title="ยังไม่มีคำขอลา" description="ยื่นขอลาจากแบบฟอร์มด้านบน" />
        ) : (
          <Card>
            <Table>
              <THead><Tr><Th>พนักงาน</Th><Th>ประเภท</Th><Th>วัน</Th><Th>สถานะ</Th><Th></Th></Tr></THead>
              <TBody>
                {leaves.map((l) => (
                  <Tr key={l.id}>
                    <Td>{empName.get(l.employeeId) ?? "—"}</Td>
                    <Td className="text-muted">{LEAVE_LABEL[l.leaveType] ?? l.leaveType}</Td>
                    <Td>{formatScaled(l.days, 100)} วัน</Td>
                    <Td><DocumentStatusBadge status={l.status} /></Td>
                    <Td>
                      {l.status === "submitted" && (
                        <div className="flex gap-1">
                          <form action={decideLeaveAction}>
                            <input type="hidden" name="id" value={l.id} />
                            <input type="hidden" name="decision" value="approved" />
                            <Button type="submit" size="sm" variant="secondary"><Check className="size-4" />อนุมัติ</Button>
                          </form>
                          <form action={decideLeaveAction}>
                            <input type="hidden" name="id" value={l.id} />
                            <input type="hidden" name="decision" value="rejected" />
                            <Button type="submit" size="sm" variant="ghost"><X className="size-4" />ปฏิเสธ</Button>
                          </form>
                        </div>
                      )}
                    </Td>
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
