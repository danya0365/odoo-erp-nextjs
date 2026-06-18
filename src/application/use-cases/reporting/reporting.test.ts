import { test } from "node:test";
import assert from "node:assert/strict";

import type { Account, Opportunity } from "@/src/domain/entities";
import { ACCOUNT_CODES } from "@/src/domain/services/accounting";
import type {
  DocSummary,
  IReportingRepository,
  MonthTotalRow,
  TopProductRow,
  ValuationRow,
} from "@/src/application/repositories/IReportingRepository";
import type { IAccountRepository } from "@/src/application/repositories/IAccountRepository";
import type {
  IJournalEntryRepository,
  TrialBalanceRow,
} from "@/src/application/repositories/IJournalEntryRepository";
import type { IOpportunityRepository } from "@/src/application/repositories/IOpportunityRepository";
import { GetInventoryValuationUseCase } from "./GetInventoryValuationUseCase";
import { GetSalesReportUseCase } from "./GetSalesReportUseCase";
import { GetDashboardUseCase } from "./GetDashboardUseCase";

class FakeReporting implements IReportingRepository {
  constructor(
    private readonly data: {
      sales?: DocSummary;
      purchases?: DocSummary;
      months?: MonthTotalRow[];
      top?: TopProductRow[];
      valuation?: ValuationRow[];
    } = {},
  ) {}
  async salesSummary(): Promise<DocSummary> {
    return this.data.sales ?? { count: 0, total: 0, paid: 0 };
  }
  async purchaseSummary(): Promise<DocSummary> {
    return this.data.purchases ?? { count: 0, total: 0, paid: 0 };
  }
  async salesByMonth(): Promise<MonthTotalRow[]> {
    return this.data.months ?? [];
  }
  async topProducts(): Promise<TopProductRow[]> {
    return this.data.top ?? [];
  }
  async inventoryValuation(): Promise<ValuationRow[]> {
    return this.data.valuation ?? [];
  }
}

test("GetInventoryValuation: คำนวณมูลค่า + เรียงมาก→น้อย + นับหมดสต๊อก", async () => {
  const reporting = new FakeReporting({
    valuation: [
      { productId: "p1", name: "A", onHand: 20000, unitCost: 5000 }, // 20 × 50 = 1000.00
      { productId: "p2", name: "B", onHand: 0, unitCost: 9000 }, // 0
      { productId: "p3", name: "C", onHand: 1000, unitCost: 30000 }, // 1 × 300 = 300.00
    ],
  });
  const res = await new GetInventoryValuationUseCase(reporting).execute("s1");
  assert.deepEqual(res.items.map((i) => i.productId), ["p1", "p3", "p2"]); // ตามมูลค่า
  assert.equal(res.items[0].value, 100000);
  assert.equal(res.totalValue, 130000);
  assert.equal(res.outOfStock, 1);
});

test("GetSalesReport: เติม 6 เดือน + ส่ง topProducts ผ่าน", async () => {
  const reporting = new FakeReporting({
    sales: { count: 3, total: 30000, paid: 20000 },
    months: [{ month: "2026-06", total: 30000 }],
    top: [{ productId: "p1", name: "A", qty: 5000, amount: 30000 }],
  });
  const res = await new GetSalesReportUseCase(reporting).execute("s1", "2026-06-18T00:00:00Z");
  assert.equal(res.months.length, 6);
  assert.equal(res.months.at(-1)!.month, "2026-06");
  assert.equal(res.months.at(-1)!.total, 30000);
  assert.equal(res.months[0].total, 0); // เดือนเก่าเติม 0
  assert.equal(res.topProducts.length, 1);
});

// ── Dashboard fakes ──
function acc(code: string, type: Account["type"]): Account {
  return { id: code, shopId: "s1", code, name: code, type, isActive: true, createdAt: "t", updatedAt: "t" };
}
class FakeAccounts implements IAccountRepository {
  async ensureDefaults(): Promise<Account[]> {
    return [acc(ACCOUNT_CODES.cash, "asset"), acc(ACCOUNT_CODES.ar, "asset"), acc(ACCOUNT_CODES.ap, "liability")];
  }
  async list(): Promise<Account[]> { return this.ensureDefaults(); }
  async findByCode(): Promise<Account | null> { return null; }
  async codeMap(): Promise<Map<string, Account>> { return new Map(); }
  async create(): Promise<Account> { return acc("x", "asset"); }
}
class FakeJournalEntries implements Partial<IJournalEntryRepository> {
  async trialBalance(): Promise<TrialBalanceRow[]> {
    return [
      { accountId: "1", code: ACCOUNT_CODES.cash, name: "เงินสด", type: "asset", debit: 10700, credit: 0 },
      { accountId: "2", code: ACCOUNT_CODES.ar, name: "ลูกหนี้", type: "asset", debit: 10700, credit: 10700 },
      { accountId: "3", code: ACCOUNT_CODES.ap, name: "เจ้าหนี้", type: "liability", debit: 0, credit: 5000 },
      { accountId: "4", code: ACCOUNT_CODES.sales, name: "รายได้", type: "income", debit: 0, credit: 10000 },
    ];
  }
}
class FakeOpps implements Partial<IOpportunityRepository> {
  async listAll(): Promise<Opportunity[]> {
    return [
      { id: "o1", shopId: "s1", name: "d", partnerId: null, contactName: null, email: null, phone: null,
        expectedRevenue: 100000, probability: 50, stageId: "st", status: "active", lostReason: null,
        salesOrderId: null, createdAt: "t", updatedAt: "t" },
    ];
  }
}

test("GetDashboard: รวมตัวเลขข้าม module ถูกต้อง", async () => {
  const reporting = new FakeReporting({
    sales: { count: 2, total: 21400, paid: 10700 },
    purchases: { count: 1, total: 5000, paid: 0 },
    months: [{ month: "2026-06", total: 21400 }],
    valuation: [{ productId: "p1", name: "A", onHand: 20000, unitCost: 5000 }],
  });
  const res = await new GetDashboardUseCase(
    reporting,
    new FakeAccounts(),
    new FakeJournalEntries() as IJournalEntryRepository,
    new FakeOpps() as IOpportunityRepository,
  ).execute("s1", "2026-06-18T00:00:00Z");

  assert.equal(res.sales.outstanding, 10700); // 21400 - 10700
  assert.equal(res.purchases.outstanding, 5000);
  assert.equal(res.cash, 10700); // asset debit-credit
  assert.equal(res.accountsReceivable, 0); // 10700 - 10700
  assert.equal(res.accountsPayable, 5000); // liability credit-debit
  assert.equal(res.netProfit, 10000);
  assert.equal(res.inventoryValue, 100000);
  assert.equal(res.pipeline.count, 1);
  assert.equal(res.pipeline.weighted, 50000);
  assert.equal(res.salesByMonth.length, 6);
});
