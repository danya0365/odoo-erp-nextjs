// integration: double-entry ledger ผ่าน repo จริง — สมดุล, idempotent, scope-by-shop, งบทดลอง
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleAccountRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleAccountRepository";
import { DrizzleJournalRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalRepository";
import { DrizzleJournalEntryRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalEntryRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { PostInvoiceJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostInvoiceJournalEntryUseCase";
import { PostPaymentJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostPaymentJournalEntryUseCase";
import { GetTrialBalanceUseCase } from "@/src/application/use-cases/accounting/GetTrialBalanceUseCase";
import { GetGeneralLedgerUseCase } from "@/src/application/use-cases/accounting/GetGeneralLedgerUseCase";
import { ACCOUNT_CODES } from "@/src/domain/services/accounting";
import type { Invoice, Payment } from "@/src/domain/entities";

function deps(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    accounts: new DrizzleAccountRepository(db),
    journals: new DrizzleJournalRepository(db),
    entries: new DrizzleJournalEntryRepository(db),
    sequences: new DrizzleSequenceRepository(db),
  };
}

const NOW = "2026-01-01T00:00:00.000Z";

test("ลง invoice + รับชำระ → งบทดลองสมดุล, ลูกหนี้สุทธิ 0, JE sequence", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const d = deps(db);
    const partners = new DrizzlePartnerRepository(db);
    const cust = await partners.create({ shopId: shop.shopId, name: "ลูกค้า", type: "customer" });

    const invoice: Invoice = {
      id: "inv-x", shopId: shop.shopId, docNumber: "INV00001", salesOrderId: null,
      customerId: cust.id, status: "posted", currency: "THB",
      untaxedAmount: 10000, taxAmount: 700, totalAmount: 10700, amountPaid: 0,
      dueDate: null, createdAt: NOW, updatedAt: NOW,
    };
    const e1 = await new PostInvoiceJournalEntryUseCase(d).execute(invoice);
    assert.equal(e1.docNumber, "JE00001");

    const payment: Payment = {
      id: "pay-x", shopId: shop.shopId, docNumber: "PAY00001", partnerId: cust.id,
      direction: "inbound", invoiceId: invoice.id, vendorBillId: null,
      amount: 10700, method: "cash", paidAt: NOW, createdAt: NOW,
    };
    const e2 = await new PostPaymentJournalEntryUseCase(d).execute(payment);
    assert.equal(e2.docNumber, "JE00002");

    const tb = await new GetTrialBalanceUseCase(d.accounts, d.entries).execute(shop.shopId);
    assert.equal(tb.totals.debit, tb.totals.credit); // สมดุลทั้งงบ
    assert.equal(tb.totals.debit, 21400);
    assert.equal(tb.netProfit, 10000); // รายได้ 10000

    // ลูกหนี้: DR 10700 (invoice) แล้ว CR 10700 (payment) → คงเหลือ 0
    const ar = (await d.accounts.findByCode(shop.shopId, ACCOUNT_CODES.ar))!;
    const led = await new GetGeneralLedgerUseCase(d.entries).execute(shop.shopId, ar.id);
    assert.equal(led.rows.at(-1)!.balance, 0);
    // เงินสด: DR 10700 → คงเหลือ 10700
    const cash = (await d.accounts.findByCode(shop.shopId, ACCOUNT_CODES.cash))!;
    const cashLed = await new GetGeneralLedgerUseCase(d.entries).execute(shop.shopId, cash.id);
    assert.equal(cashLed.rows.at(-1)!.balance, 10700);
  } finally {
    cleanup();
  }
});

test("idempotent: ลง invoice เดิมซ้ำ → ไม่เกิด entry ใหม่", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const d = deps(db);
    const partners = new DrizzlePartnerRepository(db);
    const cust = await partners.create({ shopId: shop.shopId, name: "ลูกค้า", type: "customer" });
    const invoice: Invoice = {
      id: "inv-1", shopId: shop.shopId, docNumber: "INV00001", salesOrderId: null,
      customerId: cust.id, status: "posted", currency: "THB",
      untaxedAmount: 5000, taxAmount: 0, totalAmount: 5000, amountPaid: 0,
      dueDate: null, createdAt: NOW, updatedAt: NOW,
    };
    const first = await new PostInvoiceJournalEntryUseCase(d).execute(invoice);
    const second = await new PostInvoiceJournalEntryUseCase(d).execute(invoice);
    assert.equal(first.id, second.id);
    const page = await d.entries.list(shop.shopId, { page: 1, pageSize: 50 });
    assert.equal(page.total, 1);
  } finally {
    cleanup();
  }
});

test("scope-by-shop: งบทดลองของ shop B ไม่เห็นรายการ shop A", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const d = deps(db);
    const partners = new DrizzlePartnerRepository(db);
    const custA = await partners.create({ shopId: a.shopId, name: "A", type: "customer" });

    await new PostInvoiceJournalEntryUseCase(d).execute({
      id: "inv-a", shopId: a.shopId, docNumber: "INV00001", salesOrderId: null,
      customerId: custA.id, status: "posted", currency: "THB",
      untaxedAmount: 9000, taxAmount: 0, totalAmount: 9000, amountPaid: 0,
      dueDate: null, createdAt: NOW, updatedAt: NOW,
    });

    const tbA = await new GetTrialBalanceUseCase(d.accounts, d.entries).execute(a.shopId);
    const tbB = await new GetTrialBalanceUseCase(d.accounts, d.entries).execute(b.shopId);
    assert.equal(tbA.totals.debit, 9000);
    assert.equal(tbB.totals.debit, 0); // ไม่รั่วข้าม shop
    assert.equal(tbB.rows.length, 0);
  } finally {
    cleanup();
  }
});
