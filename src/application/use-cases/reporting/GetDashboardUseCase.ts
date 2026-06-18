import {
  ACCOUNT_CODES,
  signedBalance,
  netProfit,
} from "@/src/domain/services/accounting";
import { pipelineTotals } from "@/src/domain/services/crm-status";
import {
  inventoryLineValue,
  lastNMonths,
  zeroFillMonths,
  sumBy,
  type MonthBucket,
} from "@/src/domain/services/reporting";
import type { IReportingRepository } from "@/src/application/repositories/IReportingRepository";
import type { IAccountRepository } from "@/src/application/repositories/IAccountRepository";
import type { IJournalEntryRepository } from "@/src/application/repositories/IJournalEntryRepository";
import type { IOpportunityRepository } from "@/src/application/repositories/IOpportunityRepository";

export interface DashboardResult {
  sales: { count: number; total: number; paid: number; outstanding: number };
  purchases: { count: number; total: number; paid: number; outstanding: number };
  cash: number;
  accountsReceivable: number;
  accountsPayable: number;
  netProfit: number;
  inventoryValue: number;
  pipeline: { count: number; expected: number; weighted: number };
  salesByMonth: MonthBucket[];
}

/** รวมตัวเลขหลักจากทุก module เป็นภาพเดียวของกิจการ */
export class GetDashboardUseCase {
  constructor(
    private readonly reporting: IReportingRepository,
    private readonly accounts: IAccountRepository,
    private readonly journalEntries: IJournalEntryRepository,
    private readonly opportunities: IOpportunityRepository,
  ) {}

  async execute(shopId: string, now: string): Promise<DashboardResult> {
    await this.accounts.ensureDefaults(shopId);
    const [sales, purchases, tb, byMonth, opps, valuation] = await Promise.all([
      this.reporting.salesSummary(shopId),
      this.reporting.purchaseSummary(shopId),
      this.journalEntries.trialBalance(shopId),
      this.reporting.salesByMonth(shopId),
      this.opportunities.listAll(shopId),
      this.reporting.inventoryValuation(shopId),
    ]);

    const byCode = new Map(tb.map((r) => [r.code, r]));
    const bal = (code: string) => {
      const r = byCode.get(code);
      return r ? signedBalance(r.type, r.debit, r.credit) : 0;
    };

    return {
      sales: { ...sales, outstanding: sales.total - sales.paid },
      purchases: { ...purchases, outstanding: purchases.total - purchases.paid },
      cash: bal(ACCOUNT_CODES.cash),
      accountsReceivable: bal(ACCOUNT_CODES.ar),
      accountsPayable: bal(ACCOUNT_CODES.ap),
      netProfit: netProfit(tb),
      inventoryValue: sumBy(valuation, (v) => inventoryLineValue(v.onHand, v.unitCost)),
      pipeline: pipelineTotals(opps),
      salesByMonth: zeroFillMonths(byMonth, lastNMonths(now, 6)),
    };
  }
}
