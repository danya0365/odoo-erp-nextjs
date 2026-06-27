// integration: โครงการ/ลงเวลา ผ่าน repo จริง — สร้าง→งาน→ลงเวลา→สรุปชั่วโมง + scope
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleProjectRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProjectRepository";
import { DrizzleProjectTaskRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProjectTaskRepository";
import { DrizzleTimesheetRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleTimesheetRepository";
import { DrizzleEmployeeRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleEmployeeRepository";
import { CreateProjectUseCase } from "@/src/application/use-cases/projects/CreateProjectUseCase";
import { CreateTaskUseCase } from "@/src/application/use-cases/projects/CreateTaskUseCase";
import { LogTimesheetUseCase } from "@/src/application/use-cases/projects/LogTimesheetUseCase";
import { SetProjectStatusUseCase } from "@/src/application/use-cases/projects/SetProjectStatusUseCase";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    projects: new DrizzleProjectRepository(db),
    tasks: new DrizzleProjectTaskRepository(db),
    timesheets: new DrizzleTimesheetRepository(db),
    employees: new DrizzleEmployeeRepository(db),
  };
}

test("สร้างโครงการ → งาน → ลงเวลา 2 ครั้ง → สรุปชั่วโมงรวม + แยกงาน", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const emp = await r.employees.create({ shopId: shop.shopId, name: "พนักงาน", baseSalary: 0 });
    const project = await new CreateProjectUseCase(r.projects).execute(shop.shopId, "โครงการ", null);
    const taskA = await new CreateTaskUseCase(r.projects, r.tasks).execute(shop.shopId, project.id, "งาน A");
    const taskB = await new CreateTaskUseCase(r.projects, r.tasks).execute(shop.shopId, project.id, "งาน B");

    const log = new LogTimesheetUseCase(r.projects, r.tasks, r.employees, r.timesheets);
    await log.execute({ shopId: shop.shopId, projectId: project.id, taskId: taskA.id, employeeId: emp.id, minutes: 90, date: "2026-06-01" });
    await log.execute({ shopId: shop.shopId, projectId: project.id, taskId: taskA.id, employeeId: emp.id, minutes: 30, date: "2026-06-02" });
    await log.execute({ shopId: shop.shopId, projectId: project.id, taskId: taskB.id, employeeId: emp.id, minutes: 60, date: "2026-06-02" });

    assert.equal(await r.timesheets.totalMinutesByProject(shop.shopId, project.id), 180);
    const perTask = await r.timesheets.minutesByTask(shop.shopId, project.id);
    const map = new Map(perTask.map((x) => [x.taskId, x.minutes]));
    assert.equal(map.get(taskA.id), 120);
    assert.equal(map.get(taskB.id), 60);
  } finally {
    cleanup();
  }
});

test("ลงเวลาในโครงการที่ปิดแล้ว → error", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const emp = await r.employees.create({ shopId: shop.shopId, name: "พนักงาน", baseSalary: 0 });
    const project = await new CreateProjectUseCase(r.projects).execute(shop.shopId, "P", null);
    await new SetProjectStatusUseCase(r.projects).execute(shop.shopId, project.id, "closed");
    await assert.rejects(
      () => new LogTimesheetUseCase(r.projects, r.tasks, r.employees, r.timesheets)
        .execute({ shopId: shop.shopId, projectId: project.id, employeeId: emp.id, minutes: 60, date: "t" }),
      /ปิดแล้ว/,
    );
  } finally {
    cleanup();
  }
});

test("scope-by-shop: โครงการของ A ไม่โผล่ใน B", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const r = repos(db);
    await new CreateProjectUseCase(r.projects).execute(a.shopId, "ของ A", null);
    assert.equal((await r.projects.list(a.shopId, { page: 1, pageSize: 20, status: "" })).total, 1);
    assert.equal((await r.projects.list(b.shopId, { page: 1, pageSize: 20, status: "" })).total, 0);
  } finally {
    cleanup();
  }
});
