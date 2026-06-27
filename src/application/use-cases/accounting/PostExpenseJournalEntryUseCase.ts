import type { ExpenseClaim, JournalEntry } from "@/src/domain/entities";
import { expenseClaimEntryLines } from "@/src/domain/services/accounting";
import { postJournalEntry, type PostDeps } from "./postJournalEntry";

/** ลงบัญชีการจ่ายคืนค่าใช้จ่าย: DR ค่าใช้จ่าย / CR เงินสด (สมุดรายวันทั่วไป) */
export class PostExpenseJournalEntryUseCase {
  constructor(private readonly deps: PostDeps) {}

  async execute(claim: ExpenseClaim): Promise<JournalEntry> {
    return postJournalEntry(this.deps, {
      shopId: claim.shopId,
      journalType: "general",
      sourceType: "expense",
      sourceId: claim.id,
      ref: claim.docNumber,
      date: claim.paidAt ?? claim.updatedAt,
      partnerId: null,
      draft: expenseClaimEntryLines(claim.amount),
    });
  }
}
