// integration: กระทบยอดธนาคาร + ปิดงวด + งบการเงิน
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleBankStatementRepository, DrizzlePeriodCloseRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleBankReconciliationRepository";
import { DrizzleAccountRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleAccountRepository";
import { DrizzleJournalRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalRepository";
import { DrizzleJournalEntryRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalEntryRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { ImportBankLineUseCase, ReconcileBankLineUseCase, ClosePeriodUseCase } from "@/src/application/use-cases/accounting/BankReconciliationUseCases";
import { GetFinancialsUseCase } from "@/src/application/use-cases/accounting/GetFinancialsUseCase";
import { PostInvoiceJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostInvoiceJournalEntryUseCase";
import { PostPaymentJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostPaymentJournalEntryUseCase";
import type { Invoice, Payment } from "@/src/domain/entities";

const NOW = "2026-03-15T00:00:00.000Z";

test("กระทบยอด: นำเข้า → กระทบ + งบการเงินสมดุล + ปิดงวดกันซ้ำ", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const bank = new DrizzleBankStatementRepository(db);
    const periods = new DrizzlePeriodCloseRepository(db);
    const acc = new DrizzleAccountRepository(db);
    const entries = new DrizzleJournalEntryRepository(db);
    const postDeps = { accounts: acc, journals: new DrizzleJournalRepository(db), entries, sequences: new DrizzleSequenceRepository(db) };
    const partners = new DrizzlePartnerRepository(db);
    const cust = await partners.create({ shopId: shop.shopId, name: "ลูกค้า", type: "customer" });

    // ขาย + รับเงิน → มียอดเงินสด + รายได้
    const invoice: Invoice = { id: "inv-1", shopId: shop.shopId, docNumber: "INV00001", salesOrderId: null, customerId: cust.id, status: "posted", currency: "THB", untaxedAmount: 10000, taxAmount: 0, totalAmount: 10000, amountPaid: 0, dueDate: null, createdAt: NOW, updatedAt: NOW };
    await new PostInvoiceJournalEntryUseCase(postDeps).execute(invoice);
    const payment: Payment = { id: "pay-1", shopId: shop.shopId, docNumber: "PAY00001", partnerId: cust.id, direction: "inbound", invoiceId: invoice.id, vendorBillId: null, amount: 10000, method: "cash", paidAt: NOW, createdAt: NOW };
    await new PostPaymentJournalEntryUseCase(postDeps).execute(payment);

    // นำเข้า + กระทบยอด
    const line = await new ImportBankLineUseCase(bank).execute(shop.shopId, "2026-03-15", "รับโอนจากลูกค้า", 10000);
    assert.equal(line.reconciled, false);
    await new ReconcileBankLineUseCase(bank).execute(shop.shopId, line.id, true);
    assert.equal((await bank.list(shop.shopId))[0].reconciled, true);
    // amount = 0 → error
    await assert.rejects(() => new ImportBankLineUseCase(bank).execute(shop.shopId, "2026-03-15", "x", 0), /ไม่เป็นศูนย์/);

    // งบการเงินสมดุล + กำไร = รายได้ 10000
    const fs = await new GetFinancialsUseCase(acc, entries).execute(shop.shopId);
    assert.equal(fs.netProfit, 10000);
    assert.equal(fs.assets, 10000); // เงินสด
    assert.equal(fs.balanced, true);

    // ปิดงวด + กันซ้ำ
    const close = new ClosePeriodUseCase(periods);
    await close.execute(shop.shopId, "2026-03", null, NOW);
    assert.equal((await periods.list(shop.shopId)).length, 1);
    await assert.rejects(() => close.execute(shop.shopId, "2026-03", null, NOW), /ปิดงวดนี้ไปแล้ว/);
  } finally {
    cleanup();
  }
});
