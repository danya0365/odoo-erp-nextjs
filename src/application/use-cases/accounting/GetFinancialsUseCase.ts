import { financialStatement, type FinancialStatement } from "@/src/domain/services/accounting";
import type { IAccountRepository } from "@/src/application/repositories/IAccountRepository";
import type { DateRange, IJournalEntryRepository } from "@/src/application/repositories/IJournalEntryRepository";

/** งบการเงินอย่างย่อ (P&L + งบดุล) จากงบทดลอง */
export class GetFinancialsUseCase {
  constructor(
    private readonly accounts: IAccountRepository,
    private readonly entries: IJournalEntryRepository,
  ) {}

  async execute(shopId: string, range?: DateRange): Promise<FinancialStatement> {
    await this.accounts.ensureDefaults(shopId);
    const rows = await this.entries.trialBalance(shopId, range);
    return financialStatement(rows.map((r) => ({ type: r.type, debit: r.debit, credit: r.credit })));
  }
}
