import type { Timesheet } from "@/src/domain/entities";
import type { IProjectRepository } from "@/src/application/repositories/IProjectRepository";
import type { IProjectTaskRepository } from "@/src/application/repositories/IProjectTaskRepository";
import type { IEmployeeRepository } from "@/src/application/repositories/IEmployeeRepository";
import type { ITimesheetRepository } from "@/src/application/repositories/ITimesheetRepository";

export interface LogTimesheetInput {
  shopId: string;
  projectId: string;
  taskId?: string | null;
  employeeId: string;
  minutes: number;
  date: string;
  note?: string | null;
}

/** ลงเวลาทำงาน (cross-module: ผูกพนักงาน) — โครงการต้องเปิด, พนักงานต้องทำงานอยู่ */
export class LogTimesheetUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly tasks: IProjectTaskRepository,
    private readonly employees: IEmployeeRepository,
    private readonly timesheets: ITimesheetRepository,
  ) {}

  async execute(input: LogTimesheetInput): Promise<Timesheet> {
    if (input.minutes <= 0) throw new Error("จำนวนเวลาต้องมากกว่า 0");

    const project = await this.projects.findById(input.shopId, input.projectId);
    if (!project) throw new Error("ไม่พบโครงการ");
    if (project.status === "closed") throw new Error("โครงการปิดแล้ว ลงเวลาไม่ได้");

    const employee = await this.employees.findById(input.shopId, input.employeeId);
    if (!employee || !employee.isActive) throw new Error("ไม่พบพนักงานที่ทำงานอยู่");

    if (input.taskId) {
      const task = await this.tasks.findById(input.shopId, input.taskId);
      if (!task || task.projectId !== input.projectId) {
        throw new Error("งานไม่อยู่ในโครงการนี้");
      }
    }

    return this.timesheets.create({
      shopId: input.shopId,
      projectId: input.projectId,
      taskId: input.taskId ?? null,
      employeeId: input.employeeId,
      date: input.date,
      minutes: input.minutes,
      note: input.note ?? null,
    });
  }
}
