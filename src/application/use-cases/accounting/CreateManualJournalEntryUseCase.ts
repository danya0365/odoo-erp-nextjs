import type { JournalEntry } from "@/src/domain/entities";
import { assertBalanced } from "@/src/domain/services/accounting";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IJournalRepository } from "@/src/application/repositories/IJournalRepository";
import type { IJournalEntryRepository } from "@/src/application/repositories/IJournalEntryRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

export interface ManualLineInput {
  accountId: string;
  label: string;
  debit: number;
  credit: number;
}

export interface CreateManualEntryInput {
  shopId: string;
  date: string;
  ref?: string | null;
  lines: ManualLineInput[];
}

/** ลงรายการบัญชีด้วยมือ (สมุดรายวันทั่วไป) — บังคับ ≥ 2 บรรทัด และสมดุล */
export class CreateManualJournalEntryUseCase {
  constructor(
    private readonly journals: IJournalRepository,
    private readonly entries: IJournalEntryRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(input: CreateManualEntryInput): Promise<JournalEntry> {
    if (input.lines.length < 2) throw new Error("ต้องมีอย่างน้อย 2 บรรทัด");
    assertBalanced(input.lines);

    const journals = await this.journals.ensureDefaults(input.shopId);
    const journal = journals.find((j) => j.type === "general");
    if (!journal) throw new Error("ไม่พบสมุดรายวันทั่วไป");

    const seq = await this.sequences.next(input.shopId, "journal_entry");
    return this.entries.createWithLines({
      shopId: input.shopId,
      docNumber: formatDocNumber("JE", seq, 5),
      journalId: journal.id,
      date: input.date,
      ref: input.ref ?? null,
      sourceType: "manual",
      sourceId: null,
      status: "posted",
      lines: input.lines.map((l) => ({
        accountId: l.accountId,
        partnerId: null,
        label: l.label,
        debit: l.debit,
        credit: l.credit,
      })),
    });
  }
}
