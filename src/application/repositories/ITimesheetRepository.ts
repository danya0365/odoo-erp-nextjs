import type { Timesheet } from "@/src/domain/entities";

export interface CreateTimesheetInput {
  shopId: string;
  projectId: string;
  taskId?: string | null;
  employeeId: string;
  date: string;
  minutes: number;
  note?: string | null;
}

export interface MinutesByTaskRow {
  taskId: string | null;
  minutes: number;
}

export interface ITimesheetRepository {
  create(input: CreateTimesheetInput): Promise<Timesheet>;
  listByProject(shopId: string, projectId: string): Promise<Timesheet[]>;
  totalMinutesByProject(shopId: string, projectId: string): Promise<number>;
  minutesByTask(shopId: string, projectId: string): Promise<MinutesByTaskRow[]>;
}
