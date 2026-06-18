import { test } from "node:test";
import assert from "node:assert/strict";

import type { Employee, Project, ProjectStatus, ProjectTask, Timesheet } from "@/src/domain/entities";
import type {
  CreateProjectInput,
  IProjectRepository,
} from "@/src/application/repositories/IProjectRepository";
import type {
  CreateTaskInput,
  IProjectTaskRepository,
} from "@/src/application/repositories/IProjectTaskRepository";
import type {
  CreateTimesheetInput,
  ITimesheetRepository,
} from "@/src/application/repositories/ITimesheetRepository";
import type { IEmployeeRepository } from "@/src/application/repositories/IEmployeeRepository";
import { CreateProjectUseCase } from "./CreateProjectUseCase";
import { CreateTaskUseCase } from "./CreateTaskUseCase";
import { LogTimesheetUseCase } from "./LogTimesheetUseCase";
import { SetProjectStatusUseCase } from "./SetProjectStatusUseCase";

const SHOP = "s1";
let counter = 0;
const uid = () => `id_${++counter}`;

class FakeProjects implements IProjectRepository {
  store: Project[] = [];
  async create(input: CreateProjectInput): Promise<Project> {
    const p: Project = {
      id: uid(), shopId: input.shopId, name: input.name, customerId: input.customerId ?? null,
      status: "active", createdAt: "t", updatedAt: "t",
    };
    this.store.push(p);
    return p;
  }
  async findById(_s: string, id: string) { return this.store.find((p) => p.id === id) ?? null; }
  async list() { return [...this.store]; }
  async setStatus(_s: string, id: string, status: ProjectStatus) {
    const p = this.store.find((x) => x.id === id)!;
    p.status = status;
    return p;
  }
}

class FakeTasks implements IProjectTaskRepository {
  store: ProjectTask[] = [];
  async create(input: CreateTaskInput): Promise<ProjectTask> {
    const t: ProjectTask = {
      id: uid(), shopId: input.shopId, projectId: input.projectId, name: input.name,
      status: "todo", createdAt: "t", updatedAt: "t",
    };
    this.store.push(t);
    return t;
  }
  async findById(_s: string, id: string) { return this.store.find((t) => t.id === id) ?? null; }
  async listByProject(_s: string, projectId: string) { return this.store.filter((t) => t.projectId === projectId); }
  async setStatus(_s: string, id: string, status: ProjectTask["status"]) {
    const t = this.store.find((x) => x.id === id)!;
    t.status = status;
    return t;
  }
}

class FakeEmployees implements Partial<IEmployeeRepository> {
  constructor(private readonly emps: Employee[]) {}
  async findById(_s: string, id: string) { return this.emps.find((e) => e.id === id) ?? null; }
}

class FakeTimesheets implements Partial<ITimesheetRepository> {
  store: Timesheet[] = [];
  async create(input: CreateTimesheetInput): Promise<Timesheet> {
    const ts: Timesheet = {
      id: uid(), shopId: input.shopId, projectId: input.projectId, taskId: input.taskId ?? null,
      employeeId: input.employeeId, date: input.date, minutes: input.minutes, note: input.note ?? null,
      createdAt: "t",
    };
    this.store.push(ts);
    return ts;
  }
}

function emp(id: string, active = true): Employee {
  return {
    id, shopId: SHOP, name: id, position: null, baseSalary: 0, isActive: active,
    createdAt: "t", updatedAt: "t",
  };
}

test("CreateTask: โครงการปิดแล้ว → error", async () => {
  const projects = new FakeProjects();
  const tasks = new FakeTasks();
  const p = await new CreateProjectUseCase(projects).execute(SHOP, "โปรเจกต์", null);
  await new SetProjectStatusUseCase(projects).execute(SHOP, p.id, "closed");
  await assert.rejects(
    () => new CreateTaskUseCase(projects, tasks).execute(SHOP, p.id, "งาน"),
    /ปิดแล้ว/,
  );
});

test("LogTimesheet: ลงเวลาได้ + ผูกงาน", async () => {
  const projects = new FakeProjects();
  const tasks = new FakeTasks();
  const timesheets = new FakeTimesheets();
  const p = await new CreateProjectUseCase(projects).execute(SHOP, "P", null);
  const t = await new CreateTaskUseCase(projects, tasks).execute(SHOP, p.id, "งาน");
  const employees = new FakeEmployees([emp("e1")]);

  const ts = await new LogTimesheetUseCase(
    projects, tasks, employees as IEmployeeRepository, timesheets as ITimesheetRepository,
  ).execute({ shopId: SHOP, projectId: p.id, taskId: t.id, employeeId: "e1", minutes: 90, date: "2026-06-01" });
  assert.equal(ts.minutes, 90);
  assert.equal(ts.taskId, t.id);
});

test("LogTimesheet: พนักงานพ้นสภาพ → error", async () => {
  const projects = new FakeProjects();
  const tasks = new FakeTasks();
  const p = await new CreateProjectUseCase(projects).execute(SHOP, "P", null);
  const employees = new FakeEmployees([emp("e1", false)]);
  await assert.rejects(
    () => new LogTimesheetUseCase(projects, tasks, employees as IEmployeeRepository, new FakeTimesheets() as ITimesheetRepository)
      .execute({ shopId: SHOP, projectId: p.id, employeeId: "e1", minutes: 60, date: "t" }),
    /พนักงานที่ทำงานอยู่/,
  );
});

test("LogTimesheet: งานข้ามโครงการ → error", async () => {
  const projects = new FakeProjects();
  const tasks = new FakeTasks();
  const pA = await new CreateProjectUseCase(projects).execute(SHOP, "A", null);
  const pB = await new CreateProjectUseCase(projects).execute(SHOP, "B", null);
  const taskB = await new CreateTaskUseCase(projects, tasks).execute(SHOP, pB.id, "งาน B");
  const employees = new FakeEmployees([emp("e1")]);
  await assert.rejects(
    () => new LogTimesheetUseCase(projects, tasks, employees as IEmployeeRepository, new FakeTimesheets() as ITimesheetRepository)
      .execute({ shopId: SHOP, projectId: pA.id, taskId: taskB.id, employeeId: "e1", minutes: 60, date: "t" }),
    /ไม่อยู่ในโครงการนี้/,
  );
});

test("LogTimesheet: โครงการปิด → error", async () => {
  const projects = new FakeProjects();
  const tasks = new FakeTasks();
  const p = await new CreateProjectUseCase(projects).execute(SHOP, "P", null);
  await new SetProjectStatusUseCase(projects).execute(SHOP, p.id, "closed");
  const employees = new FakeEmployees([emp("e1")]);
  await assert.rejects(
    () => new LogTimesheetUseCase(projects, tasks, employees as IEmployeeRepository, new FakeTimesheets() as ITimesheetRepository)
      .execute({ shopId: SHOP, projectId: p.id, employeeId: "e1", minutes: 60, date: "t" }),
    /ปิดแล้ว/,
  );
});
