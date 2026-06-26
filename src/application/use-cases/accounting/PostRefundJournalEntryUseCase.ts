import type { SalesReturn, JournalEntry } from "@/src/domain/entities";
import { customerRefundEntryLines } from "@/src/domain/services/accounting";
import { postJournalEntry, type PostDeps } from "./postJournalEntry";

/** ลงบัญชีการคืนเงินลูกค้า: DR ลูกหนี้ / CR เงินสด (สมุดรายวันรับ-จ่ายเงิน) */
export class PostRefundJournalEntryUseCase {
  constructor(private readonly deps: PostDeps) {}

  async execute(ret: SalesReturn): Promise<JournalEntry> {
    return postJournalEntry(this.deps, {
      shopId: ret.shopId,
      journalType: "bank",
      sourceType: "refund",
      sourceId: ret.id,
      ref: ret.docNumber,
      date: ret.updatedAt,
      partnerId: ret.customerId,
      draft: customerRefundEntryLines(ret.refundedAmount),
    });
  }
}
