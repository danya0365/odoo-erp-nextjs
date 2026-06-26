import type { SalesReturn, JournalEntry } from "@/src/domain/entities";
import { creditNoteEntryLines } from "@/src/domain/services/accounting";
import { postJournalEntry, type PostDeps } from "./postJournalEntry";

/** ลงบัญชีใบลดหนี้ (กลับด้านใบแจ้งหนี้): DR รายได้ + ภาษีขาย / CR ลูกหนี้ (สมุดรายวันขาย) */
export class PostCreditNoteJournalEntryUseCase {
  constructor(private readonly deps: PostDeps) {}

  async execute(ret: SalesReturn): Promise<JournalEntry> {
    return postJournalEntry(this.deps, {
      shopId: ret.shopId,
      journalType: "sale",
      sourceType: "credit_note",
      sourceId: ret.id,
      ref: ret.docNumber,
      date: ret.createdAt,
      partnerId: ret.customerId,
      draft: creditNoteEntryLines({
        untaxed: ret.untaxedAmount,
        tax: ret.taxAmount,
        total: ret.totalAmount,
      }),
    });
  }
}
