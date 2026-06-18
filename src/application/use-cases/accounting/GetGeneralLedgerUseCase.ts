import { totalsOf } from "@/src/domain/services/accounting";
import type {
  DateRange,
  IJournalEntryRepository,
  LedgerLine,
} from "@/src/application/repositories/IJournalEntryRepository";

export interface LedgerRow extends LedgerLine {
  balance: number; // ยอดสะสม (running balance, debit-normal)
}

export interface GeneralLedgerResult {
  rows: LedgerRow[];
  totals: { debit: number; credit: number };
}

/** บัญชีแยกประเภทของบัญชีหนึ่ง — เรียงตามวันที่ พร้อมยอดสะสม */
export class GetGeneralLedgerUseCase {
  constructor(private readonly entries: IJournalEntryRepository) {}

  async execute(
    shopId: string,
    accountId: string,
    range?: DateRange,
  ): Promise<GeneralLedgerResult> {
    const lines = await this.entries.ledger(shopId, accountId, range);
    let balance = 0;
    const rows: LedgerRow[] = lines.map((l) => {
      balance += l.debit - l.credit;
      return { ...l, balance };
    });
    return { rows, totals: totalsOf(lines) };
  }
}
