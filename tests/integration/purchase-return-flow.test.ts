// integration: คืนของผู้ขาย (vendor credit) — ตั้งหนี้ → คืน → ยืนยัน (stock OUT + ใบลดหนี้ผู้ขาย) · เจ้าหนี้สุทธิลด
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleVendorBillRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleVendorBillRepository";
import { DrizzlePurchaseReturnRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePurchaseReturnRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { DrizzleStockMoveRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockMoveRepository";
import { DrizzleStockLocationRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockLocationRepository";
import { DrizzleAccountRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleAccountRepository";
import { DrizzleJournalRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalRepository";
import { DrizzleJournalEntryRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalEntryRepository";
import { AdjustStockUseCase } from "@/src/application/use-cases/inventory/AdjustStockUseCase";
import { PostVendorBillJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostVendorBillJournalEntryUseCase";
import { PostVendorCreditJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostVendorCreditJournalEntryUseCase";
import { GetTrialBalanceUseCase } from "@/src/application/use-cases/accounting/GetTrialBalanceUseCase";
import { CreatePurchaseReturnUseCase } from "@/src/application/use-cases/purchase-returns/CreatePurchaseReturnUseCase";
import { ConfirmPurchaseReturnUseCase } from "@/src/application/use-cases/purchase-returns/ConfirmPurchaseReturnUseCase";
import { ACCOUNT_CODES } from "@/src/domain/services/accounting";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    bills: new DrizzleVendorBillRepository(db),
    returns: new DrizzlePurchaseReturnRepository(db),
    seq: new DrizzleSequenceRepository(db),
    products: new DrizzleProductRepository(db),
    partners: new DrizzlePartnerRepository(db),
    moves: new DrizzleStockMoveRepository(db),
    locations: new DrizzleStockLocationRepository(db),
    accounts: new DrizzleAccountRepository(db),
    journals: new DrizzleJournalRepository(db),
    entries: new DrizzleJournalEntryRepository(db),
  };
}

test("คืนของผู้ขาย: ตั้งหนี้ → คืน → ยืนยัน · on-hand ลด + เจ้าหนี้สุทธิ 0", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const postDeps = { accounts: r.accounts, journals: r.journals, entries: r.entries, sequences: r.seq };
    const vendor = await r.partners.create({ shopId: shop.shopId, name: "ผู้ขาย", type: "vendor" });
    const product = await r.products.create({ shopId: shop.shopId, sku: "P1", name: "วัตถุดิบ", type: "stockable", salePrice: 100, costPrice: 80, taxRateBp: 700, uom: "ชิ้น" });
    // รับเข้า 10 (on-hand 10)
    await new AdjustStockUseCase(r.products, r.moves, r.locations).execute({ shopId: shop.shopId, productId: product.id, qtyDelta: 10000 });

    // ใบตั้งหนี้ผู้ขาย (10 × 80, ภาษี 7%)
    const bill = await r.bills.createWithLines({
      shopId: shop.shopId, docNumber: "BILL00001", purchaseOrderId: null, vendorId: vendor.id,
      status: "posted", currency: "THB", untaxedAmount: 800, taxAmount: 56, totalAmount: 856,
      lines: [{ productId: product.id, description: "วัตถุดิบ", qty: 10000, unitPrice: 80, taxRateBp: 700, lineSubtotal: 800, lineTax: 56, lineTotal: 856 }],
    });
    await new PostVendorBillJournalEntryUseCase(postDeps).execute(bill);

    // คืนทั้งหมด
    const billLine = (await r.bills.listLines(shop.shopId, bill.id))[0];
    const ret = await new CreatePurchaseReturnUseCase(r.returns, r.bills, r.seq).execute(
      shop.shopId, bill.id, [{ billLineId: billLine.id, qty: 10000 }], "ของชำรุดจากผู้ขาย",
    );
    assert.equal(ret.docNumber, "VCN00001");
    assert.equal(ret.totalAmount, 856);

    // ยืนยัน → stock OUT (10 → 0) + ใบลดหนี้ผู้ขาย
    const credited = await new ConfirmPurchaseReturnUseCase(r.returns, r.moves, r.locations).execute(shop.shopId, ret.id);
    assert.equal(credited.status, "credited");
    assert.equal(await r.moves.onHandByProduct(shop.shopId, product.id), 0);
    await new PostVendorCreditJournalEntryUseCase(postDeps).execute(credited);

    // เจ้าหนี้: +856(bill) -856(credit) = 0 ; งบทดลองสมดุล
    const tb = await new GetTrialBalanceUseCase(r.accounts, r.entries).execute(shop.shopId);
    assert.equal(tb.totals.debit, tb.totals.credit);
    const ap = (await r.accounts.findByCode(shop.shopId, ACCOUNT_CODES.ap))!;
    const apRow = tb.rows.find((x) => x.accountId === ap.id);
    assert.equal(apRow ? apRow.debit - apRow.credit : 0, 0);
  } finally {
    cleanup();
  }
});
