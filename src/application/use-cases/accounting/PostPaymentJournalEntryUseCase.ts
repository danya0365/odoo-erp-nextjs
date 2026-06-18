import type { Payment, JournalEntry } from "@/src/domain/entities";
import { paymentEntryLines } from "@/src/domain/services/accounting";
import { postJournalEntry, type PostDeps } from "./postJournalEntry";

/** ลงบัญชีการรับ-จ่ายเงิน (สมุดรายวันรับ-จ่ายเงิน) — inbound ตัดลูกหนี้, outbound ตัดเจ้าหนี้ */
export class PostPaymentJournalEntryUseCase {
  constructor(private readonly deps: PostDeps) {}

  async execute(payment: Payment): Promise<JournalEntry> {
    return postJournalEntry(this.deps, {
      shopId: payment.shopId,
      journalType: "bank",
      sourceType: "payment",
      sourceId: payment.id,
      ref: payment.docNumber,
      date: payment.paidAt,
      partnerId: payment.partnerId,
      draft: paymentEntryLines(payment.direction, payment.amount),
    });
  }
}
