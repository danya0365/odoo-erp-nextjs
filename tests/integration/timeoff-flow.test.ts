// integration: ลงเวลา + การลา ผ่าน repo จริง
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleAttendanceRepository, DrizzleLeaveRequestRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleTimeoffRepository";
import { DrizzleEmployeeRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleEmployeeRepository";
import { LogAttendanceUseCase, CreateLeaveRequestUseCase, DecideLeaveRequestUseCase } from "@/src/application/use-cases/hr/TimeoffUseCases";

test("ลงเวลา + ยื่นลา → อนุมัติ (scope-by-shop)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const att = new DrizzleAttendanceRepository(db);
    const leaves = new DrizzleLeaveRequestRepository(db);
    const employees = new DrizzleEmployeeRepository(db);
    const emp = await employees.create({ shopId: a.shopId, name: "พนักงาน", baseSalary: 30000 });

    await new LogAttendanceUseCase(att, employees).execute(a.shopId, emp.id, "2026-01-02", 800, 150);
    assert.equal((await att.list(a.shopId)).length, 1);
    assert.equal((await att.list(b.shopId)).length, 0);

    const req = await new CreateLeaveRequestUseCase(leaves, employees).execute(a.shopId, emp.id, "vacation", 300, "เที่ยว");
    const approved = await new DecideLeaveRequestUseCase(leaves).execute(a.shopId, req.id, "approved");
    assert.equal(approved.status, "approved");
    assert.equal((await leaves.list(a.shopId)).length, 1);
    assert.equal((await leaves.list(b.shopId)).length, 0);
  } finally {
    cleanup();
  }
});
