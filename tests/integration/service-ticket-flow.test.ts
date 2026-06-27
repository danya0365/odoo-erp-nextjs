// integration: งานบริการ — เปิด → มอบหมาย → ปิดงาน (scope-by-shop)
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleServiceTicketRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleServiceTicketRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { DrizzleEmployeeRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleEmployeeRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { CreateServiceTicketUseCase, AssignServiceTicketUseCase, CloseServiceTicketUseCase } from "@/src/application/use-cases/service/ServiceTicketUseCases";

test("เปิด → มอบหมาย → ปิดงาน + scope-by-shop", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const tickets = new DrizzleServiceTicketRepository(db);
    const partners = new DrizzlePartnerRepository(db);
    const employees = new DrizzleEmployeeRepository(db);
    const seq = new DrizzleSequenceRepository(db);
    const cust = await partners.create({ shopId: a.shopId, name: "ลูกค้า", type: "customer" });
    const tech = await employees.create({ shopId: a.shopId, name: "ช่าง", baseSalary: 0 });

    const t = await new CreateServiceTicketUseCase(tickets, partners, seq).execute(a.shopId, cust.id, "แอร์เสีย", "ไม่เย็น");
    assert.equal(t.docNumber, "SVC00001");
    const assigned = await new AssignServiceTicketUseCase(tickets, employees).execute(a.shopId, t.id, tech.id, "2026-03-01T09:00");
    assert.equal(assigned.status, "assigned");
    assert.equal(assigned.assigneeId, tech.id);
    const done = await new CloseServiceTicketUseCase(tickets).execute(a.shopId, t.id);
    assert.equal(done.status, "done");

    assert.equal((await tickets.list(a.shopId, { page: 1, pageSize: 20, status: "" })).total, 1);
    assert.equal((await tickets.list(b.shopId, { page: 1, pageSize: 20, status: "" })).total, 0);
  } finally {
    cleanup();
  }
});
