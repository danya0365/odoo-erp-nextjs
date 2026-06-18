import { notFound } from "next/navigation";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatHours, sumMinutes } from "@/src/domain/services/timesheet";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Button } from "@/src/presentation/components/ui/Button";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Select } from "@/src/presentation/components/ui/Select";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { TaskForm } from "@/src/presentation/components/projects/TaskForm";
import { TimesheetForm } from "@/src/presentation/components/projects/TimesheetForm";
import {
  setTaskStatusAction,
  setProjectStatusAction,
} from "@/src/presentation/actions/project-actions";

const TASK_LABEL: Record<string, { label: string; variant: "neutral" | "warning" | "success" }> = {
  todo: { label: "รอทำ", variant: "neutral" },
  in_progress: { label: "กำลังทำ", variant: "warning" },
  done: { label: "เสร็จ", variant: "success" },
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const project = await container.projectRepository.findById(shopId, id);
  if (!project) notFound();

  const [customer, tasks, entries, totalMin, perTask, employees, allEmployees] = await Promise.all([
    project.customerId ? container.partnerRepository.findById(shopId, project.customerId) : Promise.resolve(null),
    container.projectTaskRepository.listByProject(shopId, id),
    container.timesheetRepository.listByProject(shopId, id),
    container.timesheetRepository.totalMinutesByProject(shopId, id),
    container.timesheetRepository.minutesByTask(shopId, id),
    container.employeeRepository.listActive(shopId),
    container.employeeRepository.list(shopId),
  ]);

  const empName = new Map(allEmployees.map((e) => [e.id, e.name]));
  const taskName = new Map(tasks.map((t) => [t.id, t.name]));
  const minutesByTask = new Map(perTask.map((r) => [r.taskId, r.minutes]));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Container className="max-w-4xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "โครงการ", href: "/shop/projects" },
          { label: project.name },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Badge variant={project.status === "active" ? "brand" : "neutral"}>
            {project.status === "active" ? "กำลังดำเนินการ" : "ปิดแล้ว"}
          </Badge>
        </div>
        <form action={setProjectStatusAction}>
          <input type="hidden" name="id" value={project.id} />
          <input type="hidden" name="status" value={project.status === "active" ? "closed" : "active"} />
          <Button variant="ghost" size="sm" type="submit">
            {project.status === "active" ? "ปิดโครงการ" : "เปิดใหม่"}
          </Button>
        </form>
      </div>
      <p className="text-muted">ลูกค้า: {customer?.name ?? "—"}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="ชั่วโมงรวม" value={formatHours(totalMin)} />
        <StatCard label="งานทั้งหมด" value={String(tasks.length)} />
        <StatCard label="งานเสร็จ" value={String(tasks.filter((t) => t.status === "done").length)} />
      </div>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-semibold">งาน</h2>
          {project.status === "active" && <TaskForm projectId={project.id} />}
          {tasks.length > 0 && (
            <Table>
              <THead>
                <Tr>
                  <Th>งาน</Th>
                  <Th>ชั่วโมง</Th>
                  <Th>สถานะ</Th>
                </Tr>
              </THead>
              <TBody>
                {tasks.map((t) => {
                  const meta = TASK_LABEL[t.status];
                  return (
                    <Tr key={t.id}>
                      <Td className="font-medium">{t.name}</Td>
                      <Td>{formatHours(minutesByTask.get(t.id) ?? 0)}</Td>
                      <Td>
                        <form action={setTaskStatusAction} className="flex items-center gap-2">
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="taskId" value={t.id} />
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          <Select
                            name="status"
                            aria-label={`สถานะ ${t.name}`}
                            defaultValue={t.status}
                            className="w-32"
                          >
                            <option value="todo">รอทำ</option>
                            <option value="in_progress">กำลังทำ</option>
                            <option value="done">เสร็จ</option>
                          </Select>
                          <Button type="submit" variant="ghost" size="sm">เปลี่ยน</Button>
                        </form>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {project.status === "active" && (
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-lg font-semibold">ลงเวลาทำงาน</h2>
            <TimesheetForm
              projectId={project.id}
              employees={employees.map((e) => ({ id: e.id, name: e.name }))}
              tasks={tasks.map((t) => ({ id: t.id, name: t.name }))}
              defaultDate={today}
            />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-lg font-semibold">บันทึกเวลา</h2>
          {entries.length === 0 ? (
            <p className="text-sm text-muted">ยังไม่มีการลงเวลา</p>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>วันที่</Th>
                  <Th>พนักงาน</Th>
                  <Th>งาน</Th>
                  <Th>ชั่วโมง</Th>
                </Tr>
              </THead>
              <TBody>
                {entries.map((e) => (
                  <Tr key={e.id}>
                    <Td>{new Date(e.date).toLocaleDateString("th-TH")}</Td>
                    <Td>{empName.get(e.employeeId) ?? "—"}</Td>
                    <Td>{e.taskId ? (taskName.get(e.taskId) ?? "—") : "ทั้งโครงการ"}</Td>
                    <Td>{formatHours(e.minutes)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
          <p className="text-right text-sm font-semibold">รวม {formatHours(sumMinutes(entries))} ชม.</p>
        </CardBody>
      </Card>
    </Container>
  );
}
