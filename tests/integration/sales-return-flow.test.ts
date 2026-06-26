// integration: คืนสินค้า/ใบลดหนี้ (RMA) ผ่าน repo จริง —
// ขาย→ส่ง→วางบิล→จ่าย แล้วคืน→ยืนยัน(stock IN + ใบลดหนี้)→คืนเงิน · on-hand กลับเพิ่ม + งบทดลองสมดุล
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleSalesOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSalesOrderRepository";
import { DrizzleInvoiceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleInvoiceRepository";
import { DrizzleSalesReturnRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSalesReturnRepository";
import { DrizzlePaymentRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePaymentRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { DrizzleStockMoveRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockMoveRepository";
import { DrizzleStockLocationRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockLocationRepository";
import { DrizzleAccountRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleAccountRepository";
import { DrizzleJournalRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalRepository";
import { DrizzleJournalEntryRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalEntryRepository";
import { CreateQuotationUseCase } from "@/src/application/use-cases/sales/CreateQuotationUseCase";
import { ConfirmSalesOrderUseCase } from "@/src/application/use-cases/sales/ConfirmSalesOrderUseCase";
import { DeliverSalesOrderUseCase } from "@/src/application/use-cases/sales/DeliverSalesOrderUseCase";
import { InvoiceSalesOrderUseCase } from "@/src/application/use-cases/sales/InvoiceSalesOrderUseCase";
import { RegisterInvoicePaymentUseCase } from "@/src/application/use-cases/sales/RegisterInvoicePaymentUseCase";
import { AdjustStockUseCase } from "@/src/application/use-cases/inventory/AdjustStockUseCase";
import { PostInvoiceJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostInvoiceJournalEntryUseCase";
import { PostPaymentJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostPaymentJournalEntryUseCase";
import { PostCreditNoteJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostCreditNoteJournalEntryUseCase";
import { PostRefundJournalEntryUseCase } from "@/src/application/use-cases/accounting/PostRefundJournalEntryUseCase";
import { GetTrialBalanceUseCase } from "@/src/application/use-cases/accounting/GetTrialBalanceUseCase";
import { CreateSalesReturnUseCase } from "@/src/application/use-cases/sales-returns/CreateSalesReturnUseCase";
import { ConfirmSalesReturnUseCase } from "@/src/application/use-cases/sales-returns/ConfirmSalesReturnUseCase";
import { RefundSalesReturnUseCase } from "@/src/application/use-cases/sales-returns/RefundSalesReturnUseCase";
import { ACCOUNT_CODES } from "@/src/domain/services/accounting";

const NOW = "2026-01-01T00:00:00.000Z";

function repos(db: Awaited<ReturnType<typeof withTestDb>>["db"]) {
  return {
    sales: new DrizzleSalesOrderRepository(db),
    invoices: new DrizzleInvoiceRepository(db),
    returns: new DrizzleSalesReturnRepository(db),
    payments: new DrizzlePaymentRepository(db),
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

test("RMA เต็มวงจร: ขาย→คืน→ใบลดหนี้→คืนเงิน · on-hand กลับเพิ่ม + งบทดลองสมดุล", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const r = repos(db);
    const postDeps = { accounts: r.accounts, journals: r.journals, entries: r.entries, sequences: r.seq };

    const customer = await r.partners.create({ shopId: shop.shopId, name: "ลูกค้า", type: "customer" });
    const product = await r.products.create({
      shopId: shop.shopId, sku: "P1", name: "สินค้า", type: "stockable",
      salePrice: 100, costPrice: 80, taxRateBp: 700, uom: "ชิ้น",
    });
    await new AdjustStockUseCase(r.products, r.moves, r.locations).execute({
      shopId: shop.shopId, productId: product.id, qtyDelta: 100000, // 100 ชิ้น
    });

    // ขาย 10 → ส่ง (on-hand 90) → วางบิล → จ่ายเต็ม
    const so = await new CreateQuotationUseCase(r.sales).execute({
      shopId: shop.shopId, customerId: customer.id, orderDate: NOW,
      lines: [{ productId: product.id, description: product.name, qtyOrdered: 10000, unitPrice: 100, taxRateBp: 700 }],
    });
    await new ConfirmSalesOrderUseCase(r.sales, r.seq).execute(shop.shopId, so.id, NOW);
    const soLine = (await r.sales.findById(shop.shopId, so.id))!.lines[0];
    await new DeliverSalesOrderUseCase(r.sales, r.moves, r.locations).execute(shop.shopId, so.id, [{ lineId: soLine.id, qty: 10000 }]);
    assert.equal(await r.moves.onHandByProduct(shop.shopId, product.id), 90000);

    const invoice = await new InvoiceSalesOrderUseCase(r.sales, r.invoices, r.seq).execute(shop.shopId, so.id);
    await new PostInvoiceJournalEntryUseCase(postDeps).execute(invoice);
    const payment = await new RegisterInvoicePaymentUseCase(r.invoices, r.payments, r.sales, r.seq).execute(
      shop.shopId, invoice.id, 1070, "cash", NOW,
    );
    await new PostPaymentJournalEntryUseCase(postDeps).execute(payment);

    // ── คืนสินค้าเต็มจำนวน ──
    const invLine = (await r.invoices.listLines(shop.shopId, invoice.id))[0];
    const ret = await new CreateSalesReturnUseCase(r.returns, r.invoices, r.seq).execute(
      shop.shopId, invoice.id, [{ invoiceLineId: invLine.id, qty: 10000 }], "สินค้าชำรุด",
    );
    assert.equal(ret.docNumber, "CN00001");
    assert.equal(ret.totalAmount, 1070);
    assert.equal(ret.status, "draft");

    // ยืนยันคืน → stock IN กลับเข้า on-hand 90 → 100 + ออกใบลดหนี้
    const credited = await new ConfirmSalesReturnUseCase(r.returns, r.moves, r.locations).execute(shop.shopId, ret.id);
    assert.equal(credited.status, "credited");
    assert.equal(await r.moves.onHandByProduct(shop.shopId, product.id), 100000); // กลับเท่าเดิม
    await new PostCreditNoteJournalEntryUseCase(postDeps).execute(credited);

    // คืนเงิน → payment outbound + ลงบัญชี
    const refunded = await new RefundSalesReturnUseCase(r.returns, r.payments, r.seq).execute(shop.shopId, ret.id, "cash", NOW);
    assert.equal(refunded.status, "refunded");
    assert.equal(refunded.refundedAmount, 1070);
    await new PostRefundJournalEntryUseCase(postDeps).execute(refunded);

    // ── ตรวจบัญชี: งบทดลองสมดุล, ลูกหนี้ & เงินสด สุทธิ 0 (เพราะคืนครบ) ──
    const tb = await new GetTrialBalanceUseCase(r.accounts, r.entries).execute(shop.shopId);
    assert.equal(tb.totals.debit, tb.totals.credit); // สมดุลทั้งงบ
    assert.equal(tb.netProfit, 0); // รายได้ขายแล้วกลับด้วยใบลดหนี้ → 0

    const ar = (await r.accounts.findByCode(shop.shopId, ACCOUNT_CODES.ar))!;
    const cash = (await r.accounts.findByCode(shop.shopId, ACCOUNT_CODES.cash))!;
    const arRow = tb.rows.find((x) => x.accountId === ar.id);
    const cashRow = tb.rows.find((x) => x.accountId === cash.id);
    // ลูกหนี้: +1070(invoice) -1070(pay) -1070(CN) +1070(refund) = 0
    assert.equal(arRow ? arRow.debit - arRow.credit : 0, 0);
    // เงินสด: +1070(pay) -1070(refund) = 0
    assert.equal(cashRow ? cashRow.debit - cashRow.credit : 0, 0);
  } finally {
    cleanup();
  }
});

test("scope-by-shop: ใบคืนของ A ไม่โผล่ใน B", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const a = await seedShop(db, "alpha", "o@alpha.test");
    const b = await seedShop(db, "beta", "o@beta.test");
    const r = repos(db);
    const cust = await r.partners.create({ shopId: a.shopId, name: "A", type: "customer" });
    const prod = await r.products.create({
      shopId: a.shopId, sku: "P1", name: "สินค้า", type: "stockable",
      salePrice: 100, costPrice: 0, taxRateBp: 0, uom: "ชิ้น",
    });
    const inv = await r.invoices.createWithLines({
      shopId: a.shopId, docNumber: "INV00001", salesOrderId: null, customerId: cust.id,
      status: "posted", currency: "THB", untaxedAmount: 100, taxAmount: 0, totalAmount: 100,
      lines: [{ productId: prod.id, description: "สินค้า", qty: 1000, unitPrice: 100, taxRateBp: 0, lineSubtotal: 100, lineTax: 0, lineTotal: 100 }],
    });
    const invLine = (await r.invoices.listLines(a.shopId, inv.id))[0];
    await new CreateSalesReturnUseCase(r.returns, r.invoices, r.seq).execute(
      a.shopId, inv.id, [{ invoiceLineId: invLine.id, qty: 1000 }], null,
    );
    assert.equal((await r.returns.list(a.shopId, { page: 1, pageSize: 20, status: "" })).total, 1);
    assert.equal((await r.returns.list(b.shopId, { page: 1, pageSize: 20, status: "" })).total, 0);
  } finally {
    cleanup();
  }
});
