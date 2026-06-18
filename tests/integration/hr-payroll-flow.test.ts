// integration: HR/Payroll ผ่าน repo จริง — สร้างพนักงาน → ออกงวด → อนุมัติ (ลงบัญชีสมดุล) + scope
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleEmployeeRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleEmployeeRepository";
import { DrizzlePayrollRunRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePayrollRunRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzleAccountRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleAccountRepository";
import { DrizzleJournalRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalRepository";
import { DrizzleJournalEntryRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalEntryRepository";
import { CreateEmployeeUseCase } from "@/src/application/use-cases/hr/CreateEmployeeUseCase";
import { GeneratePayrollRunUseCase } from "@/src/application/use-cases/hr/GeneratePayrollRunUseCase";
import { PostPayrollRunUseCase } from "@/src/application/use-cases/hr/PostPayrollRunUseCase";
import { ACCOUNT_CODES, signedBalance } from "@/src/domain/services/accounting";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    employees: new DrizzleEmployeeRepository(db),
    runs: new DrizzlePayrollRunRepository(db),
    sequences: new DrizzleSequenceRepository(db),
    postDeps: {
      accounts: new DrizzleAccountRepository(db),
      journals: new DrizzleJournalRepository(db),
      entries: new DrizzleJournalEntryRepository(db),
      sequences: new DrizzleSequenceRepository(db),
    },
  };
}

test("ออกงวด → อนุมัติ → ลงบัญชี (งบทดลองสมดุล, ค่าใช้จ่ายเงินเดือน, ภาษีหักค้างจ่าย)", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    await new CreateEmployeeUseCase(r.employees).execute(shop.shopId, "พนักงาน A", "dev", 3000000); // 30,000
    await new CreateEmployeeUseCase(r.employees).execute(shop.shopId, "พนักงาน B", "ops", 2000000); // 20,000

    const run = await new GeneratePayrollRunUseCase(r.employees, r.runs).execute(shop.shopId, "2026-06", 300); // 3%
    const full = await r.runs.findById(shop.shopId, run.id);
    assert.equal(full!.slips.length, 2);

    const posted = await new PostPayrollRunUseCase(r.runs, r.sequences, r.postDeps).execute(shop.shopId, run.id, "2026-06-30T00:00:00Z");
    assert.equal(posted.docNumber, "PR00001");
    assert.equal(posted.status, "posted");

    // gross 50,000 → tax 1,500 → net 48,500
    const tb = await r.postDeps.entries.trialBalance(shop.shopId);
    assert.equal(tb.reduce((s, x) => s + x.debit, 0), tb.reduce((s, x) => s + x.credit, 0));
    const byCode = new Map(tb.map((x) => [x.code, x]));
    const salary = byCode.get(ACCOUNT_CODES.salaryExpense)!;
    assert.equal(signedBalance(salary.type, salary.debit, salary.credit), 5000000); // ค่าใช้จ่าย 50,000
    const wht = byCode.get(ACCOUNT_CODES.whtPayable)!;
    assert.equal(signedBalance(wht.type, wht.debit, wht.credit), 150000); // ภาษีหักค้างจ่าย 1,500
  } finally {
    cleanup();
  }
});

test("อนุมัติซ้ำไม่ได้ + scope-by-shop", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const r = repos(db);
    await new CreateEmployeeUseCase(r.employees).execute(a.shopId, "A", null, 1000000);
    const run = await new GeneratePayrollRunUseCase(r.employees, r.runs).execute(a.shopId, "2026-06", 0);
    await new PostPayrollRunUseCase(r.runs, r.sequences, r.postDeps).execute(a.shopId, run.id, "t");
    await assert.rejects(
      () => new PostPayrollRunUseCase(r.runs, r.sequences, r.postDeps).execute(a.shopId, run.id, "t"),
      /อนุมัติแล้ว/,
    );
    // B ไม่เห็นพนักงาน/งวดของ A
    assert.equal((await r.employees.listActive(b.shopId)).length, 0);
    assert.equal((await r.runs.list(b.shopId)).length, 0);
  } finally {
    cleanup();
  }
});
