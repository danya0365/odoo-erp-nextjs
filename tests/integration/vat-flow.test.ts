// integration: ภพ.30 — โพสต์ invoice (ภาษีขาย) + bill (ภาษีซื้อ) แล้วรายงานสรุปถูก + บันทึกการยื่น (กันซ้ำ)
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleAccountRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleAccountRepository";
import { DrizzleJournalRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalRepository";
import { DrizzleJournalEntryRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalEntryRepository";
import { DrizzleVatFilingRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleVatFilingRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { PostInvoiceJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostInvoiceJournalEntryUseCase";
import { PostVendorBillJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostVendorBillJournalEntryUseCase";
import { GetVatReportUseCase } from "@/src/application/use-cases/accounting/GetVatReportUseCase";
import { FileVatReturnUseCase } from "@/src/application/use-cases/accounting/FileVatReturnUseCase";
import { monthRange } from "@/src/domain/services/tax";
import type { Invoice, VendorBill } from "@/src/domain/entities";

const NOW = "2026-03-15T00:00:00.000Z";

function deps(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    accounts: new DrizzleAccountRepository(db),
    journals: new DrizzleJournalRepository(db),
    entries: new DrizzleJournalEntryRepository(db),
    sequences: new DrizzleSequenceRepository(db),
  };
}

test("ภพ.30: ภาษีขาย − ภาษีซื้อ = สุทธิ + บันทึกยื่นกันซ้ำ", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const d = deps(db);
    const filings = new DrizzleVatFilingRepository(db);
    const partners = new DrizzlePartnerRepository(db);
    const cust = await partners.create({ shopId: shop.shopId, name: "ลูกค้า", type: "customer" });
    const vendor = await partners.create({ shopId: shop.shopId, name: "ผู้ขาย", type: "vendor" });

    // ภาษีขาย 700 (invoice)
    const invoice: Invoice = {
      id: "inv-1", shopId: shop.shopId, docNumber: "INV00001", salesOrderId: null,
      customerId: cust.id, status: "posted", currency: "THB",
      untaxedAmount: 10000, taxAmount: 700, totalAmount: 10700, amountPaid: 0,
      dueDate: null, createdAt: NOW, updatedAt: NOW,
    };
    await new PostInvoiceJournalEntryUseCase(d).execute(invoice);

    // ภาษีซื้อ 280 (vendor bill)
    const bill: VendorBill = {
      id: "vb-1", shopId: shop.shopId, docNumber: "BILL00001", purchaseOrderId: null,
      vendorId: vendor.id, status: "posted", currency: "THB",
      untaxedAmount: 4000, taxAmount: 280, totalAmount: 4280, amountPaid: 0,
      dueDate: null, createdAt: NOW, updatedAt: NOW,
    };
    await new PostVendorBillJournalEntryUseCase(d).execute(bill);

    const { from, to, periodEnd } = monthRange("2026-03");
    const report = await new GetVatReportUseCase(d.entries).execute(shop.shopId, { from, to });
    assert.equal(report.outputVat, 700);
    assert.equal(report.inputVat, 280);
    assert.equal(report.netPayable, 420);

    // นอกงวด (เดือนอื่น) → 0
    const other = await new GetVatReportUseCase(d.entries).execute(shop.shopId, monthRange("2026-01"));
    assert.equal(other.outputVat, 0);
    assert.equal(other.inputVat, 0);

    // ยื่น → บันทึก, ยื่นซ้ำ → error
    const file = new FileVatReturnUseCase(filings);
    const filed = await file.execute(shop.shopId, "2026-03", periodEnd, report, NOW);
    assert.equal(filed.netPayable, 420);
    assert.equal((await filings.list(shop.shopId)).length, 1);
    await assert.rejects(() => file.execute(shop.shopId, "2026-03", periodEnd, report, NOW), /ยื่น.*แล้ว/);
  } finally {
    cleanup();
  }
});
