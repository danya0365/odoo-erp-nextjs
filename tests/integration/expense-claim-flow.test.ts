// integration: เบิกค่าใช้จ่าย — ยื่น → อนุมัติ → จ่าย (ลงบัญชี DR ค่าใช้จ่าย/CR เงินสด)
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleExpenseClaimRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleExpenseClaimRepository";
import { DrizzleEmployeeRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleEmployeeRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzleAccountRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleAccountRepository";
import { DrizzleJournalRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalRepository";
import { DrizzleJournalEntryRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalEntryRepository";
import { CreateExpenseClaimUseCase } from "@/src/application/use-cases/hr/CreateExpenseClaimUseCase";
import { ApproveExpenseClaimUseCase, PayExpenseClaimUseCase } from "@/src/application/use-cases/hr/TransitionExpenseClaimUseCase";
import { PostExpenseJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostExpenseJournalEntryUseCase";
import { GetTrialBalanceUseCase } from "@/src/application/use-cases/accounting/GetTrialBalanceUseCase";
import { ACCOUNT_CODES, signedBalance } from "@/src/domain/services/accounting";

const NOW = "2026-01-01T00:00:00.000Z";

test("เบิก → อนุมัติ → จ่าย: ค่าใช้จ่ายเพิ่ม, เงินสดลด, งบทดลองสมดุล", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const claims = new DrizzleExpenseClaimRepository(db);
    const employees = new DrizzleEmployeeRepository(db);
    const seq = new DrizzleSequenceRepository(db);
    const postDeps = { accounts: new DrizzleAccountRepository(db), journals: new DrizzleJournalRepository(db), entries: new DrizzleJournalEntryRepository(db), sequences: seq };

    const emp = await employees.create({ shopId: shop.shopId, name: "พนักงาน", baseSalary: 30000 });
    const claim = await new CreateExpenseClaimUseCase(claims, employees, seq).execute(shop.shopId, {
      employeeId: emp.id, category: "เดินทาง", description: "แท็กซี่", amount: 50000,
    });
    assert.equal(claim.docNumber, "EXP00001");

    await new ApproveExpenseClaimUseCase(claims).execute(shop.shopId, claim.id);
    const paid = await new PayExpenseClaimUseCase(claims).execute(shop.shopId, claim.id, NOW);
    assert.equal(paid.status, "paid");
    await new PostExpenseJournalEntryUseCase(postDeps).execute(paid);

    const tb = await new GetTrialBalanceUseCase(postDeps.accounts, postDeps.entries).execute(shop.shopId);
    assert.equal(tb.totals.debit, tb.totals.credit);
    const byCode = new Map(tb.rows.map((r) => [r.code, r]));
    const exp = byCode.get(ACCOUNT_CODES.expense)!;
    const cash = byCode.get(ACCOUNT_CODES.cash)!;
    assert.equal(signedBalance(exp.type, exp.debit, exp.credit), 50000); // ค่าใช้จ่าย +50000
    assert.equal(signedBalance(cash.type, cash.debit, cash.credit), -50000); // เงินสด -50000
  } finally {
    cleanup();
  }
});
