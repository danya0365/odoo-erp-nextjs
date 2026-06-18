import { netProfit } from "@/src/domain/services/accounting";
import type { IAccountRepository } from "@/src/application/repositories/IAccountRepository";
import type {
  DateRange,
  IJournalEntryRepository,
  TrialBalanceRow,
} from "@/src/application/repositories/IJournalEntryRepository";

export interface TrialBalanceResult {
  rows: TrialBalanceRow[];
  totals: { debit: number; credit: number };
  netProfit: number;
}

/** งบทดลอง: ยอดเดบิต/เครดิตรวมต่อบัญชี + ผลรวม + กำไรสุทธิ */
export class GetTrialBalanceUseCase {
  constructor(
    private readonly accounts: IAccountRepository,
    private readonly entries: IJournalEntryRepository,
  ) {}

  async execute(shopId: string, range?: DateRange): Promise<TrialBalanceResult> {
    await this.accounts.ensureDefaults(shopId);
    const rows = await this.entries.trialBalance(shopId, range);
    const totals = rows.reduce(
      (a, r) => ({ debit: a.debit + r.debit, credit: a.credit + r.credit }),
      { debit: 0, credit: 0 },
    );
    return { rows, totals, netProfit: netProfit(rows) };
  }
}
