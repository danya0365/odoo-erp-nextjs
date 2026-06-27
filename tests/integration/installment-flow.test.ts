// integration: ผ่อนชำระ — ตั้งแผนจากใบแจ้งหนี้ → เก็บทุกงวด → invoice paid + plan completed
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTestDb } from "@/tests/helpers/withTestDb";
import { seedShop } from "@/tests/helpers/seedShop";
import { DrizzleInstallmentPlanRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleInstallmentPlanRepository";
import { DrizzleInvoiceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleInvoiceRepository";
import { DrizzlePaymentRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePaymentRepository";
import { DrizzleSalesOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSalesOrderRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { CreateInstallmentPlanUseCase } from "@/src/application/use-cases/sales/CreateInstallmentPlanUseCase";
import { PayInstallmentUseCase } from "@/src/application/use-cases/sales/PayInstallmentUseCase";

const NOW = "2026-01-01T00:00:00.000Z";

test("ตั้งแผน 3 งวด → เก็บครบ → invoice paid + plan completed", async () => {
  const { db, cleanup } = await withTestDb();
  try {
    const shop = await seedShop(db, "alpha", "o@alpha.test");
    const plans = new DrizzleInstallmentPlanRepository(db);
    const invoices = new DrizzleInvoiceRepository(db);
    const payments = new DrizzlePaymentRepository(db);
    const sales = new DrizzleSalesOrderRepository(db);
    const seq = new DrizzleSequenceRepository(db);
    const partners = new DrizzlePartnerRepository(db);
    const cust = await partners.create({ shopId: shop.shopId, name: "ลูกค้า", type: "customer" });

    const inv = await invoices.createWithLines({
      shopId: shop.shopId, docNumber: "INV00001", salesOrderId: null, customerId: cust.id,
      status: "posted", currency: "THB", untaxedAmount: 900, taxAmount: 0, totalAmount: 900, lines: [],
    });

    const plan = await new CreateInstallmentPlanUseCase(plans, invoices).execute(shop.shopId, inv.id, 3, 30, NOW);
    const withLines = (await plans.findById(shop.shopId, plan.id))!;
    assert.equal(withLines.lines.length, 3);
    assert.equal(withLines.lines[0].amount, 300); // 900/3

    // ตั้งแผนซ้ำ → error
    await assert.rejects(() => new CreateInstallmentPlanUseCase(plans, invoices).execute(shop.shopId, inv.id, 2, 30, NOW), /มีแผน/);

    const pay = new PayInstallmentUseCase(plans, invoices, payments, sales, seq);
    // เก็บ 2 งวดแรก → ยังไม่ครบ
    await pay.execute(shop.shopId, plan.id, withLines.lines[0].id, NOW);
    await pay.execute(shop.shopId, plan.id, withLines.lines[1].id, NOW);
    assert.equal((await plans.findById(shop.shopId, plan.id))!.status, "active");
    assert.equal((await invoices.findById(shop.shopId, inv.id))!.amountPaid, 600);

    // จ่ายงวดซ้ำ → error
    await assert.rejects(() => pay.execute(shop.shopId, plan.id, withLines.lines[0].id, NOW), /ชำระแล้ว/);

    // เก็บงวดสุดท้าย → completed + invoice paid
    await pay.execute(shop.shopId, plan.id, withLines.lines[2].id, NOW);
    assert.equal((await plans.findById(shop.shopId, plan.id))!.status, "completed");
    const finalInv = (await invoices.findById(shop.shopId, inv.id))!;
    assert.equal(finalInv.amountPaid, 900);
    assert.equal(finalInv.status, "paid");
  } finally {
    cleanup();
  }
});
