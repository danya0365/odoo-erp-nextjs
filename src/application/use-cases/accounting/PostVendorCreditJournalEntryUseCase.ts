import type { PurchaseReturn, JournalEntry } from "@/src/domain/entities";
import { vendorCreditNoteEntryLines } from "@/src/domain/services/accounting";
import { postJournalEntry, type PostDeps } from "./postJournalEntry";

/** ลงบัญชีใบลดหนี้ผู้ขาย (กลับด้านใบตั้งหนี้): DR เจ้าหนี้ / CR ค่าใช้จ่าย + ภาษีซื้อ (สมุดรายวันซื้อ) */
export class PostVendorCreditJournalEntryUseCase {
  constructor(private readonly deps: PostDeps) {}

  async execute(ret: PurchaseReturn): Promise<JournalEntry> {
    return postJournalEntry(this.deps, {
      shopId: ret.shopId,
      journalType: "purchase",
      sourceType: "vendor_credit",
      sourceId: ret.id,
      ref: ret.docNumber,
      date: ret.createdAt,
      partnerId: ret.vendorId,
      draft: vendorCreditNoteEntryLines({
        untaxed: ret.untaxedAmount,
        tax: ret.taxAmount,
        total: ret.totalAmount,
      }),
    });
  }
}
