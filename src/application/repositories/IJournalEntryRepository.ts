import type {
  JournalEntry,
  JournalEntryWithLines,
  JournalEntrySourceType,
  JournalEntryStatus,
  AccountType,
} from "@/src/domain/entities";
import type { Page, PageQuery } from "./pagination";

export interface JournalEntryLineInput {
  accountId: string;
  partnerId?: string | null;
  label: string;
  debit: number;
  credit: number;
}

export interface CreateJournalEntryInput {
  shopId: string;
  docNumber: string;
  journalId: string;
  date: string;
  ref?: string | null;
  sourceType: JournalEntrySourceType;
  sourceId?: string | null;
  status: JournalEntryStatus;
  lines: JournalEntryLineInput[];
}

export interface DateRange {
  from?: string;
  to?: string;
}

/** แถวงบทดลอง: ยอดเดบิต/เครดิตรวมต่อบัญชี */
export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
}

/** บรรทัดในบัญชีแยกประเภท (general ledger) ของบัญชีหนึ่ง */
export interface LedgerLine {
  entryId: string;
  docNumber: string;
  date: string;
  ref: string | null;
  label: string;
  debit: number;
  credit: number;
}

export interface IJournalEntryRepository {
  createWithLines(input: CreateJournalEntryInput): Promise<JournalEntry>;
  findById(shopId: string, id: string): Promise<JournalEntryWithLines | null>;
  /** กันลงซ้ำ: หา entry ที่ผูกกับเอกสารต้นทางแล้วหรือยัง */
  findBySource(
    shopId: string,
    sourceType: JournalEntrySourceType,
    sourceId: string,
  ): Promise<JournalEntry | null>;
  list(shopId: string, query: PageQuery): Promise<Page<JournalEntry>>;
  trialBalance(shopId: string, range?: DateRange): Promise<TrialBalanceRow[]>;
  ledger(shopId: string, accountId: string, range?: DateRange): Promise<LedgerLine[]>;
}
