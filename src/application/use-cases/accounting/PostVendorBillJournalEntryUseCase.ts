import type { VendorBill, JournalEntry } from "@/src/domain/entities";
import { billEntryLines } from "@/src/domain/services/accounting";
import { postJournalEntry, type PostDeps } from "./postJournalEntry";

/** ลงบัญชีใบตั้งหนี้ผู้ขาย: DR ค่าใช้จ่าย + ภาษีซื้อ / CR เจ้าหนี้ (สมุดรายวันซื้อ) */
export class PostVendorBillJournalEntryUseCase {
  constructor(private readonly deps: PostDeps) {}

  async execute(bill: VendorBill): Promise<JournalEntry> {
    return postJournalEntry(this.deps, {
      shopId: bill.shopId,
      journalType: "purchase",
      sourceType: "bill",
      sourceId: bill.id,
      ref: bill.docNumber,
      date: bill.createdAt,
      partnerId: bill.vendorId,
      draft: billEntryLines({
        untaxed: bill.untaxedAmount,
        tax: bill.taxAmount,
        total: bill.totalAmount,
      }),
    });
  }
}
