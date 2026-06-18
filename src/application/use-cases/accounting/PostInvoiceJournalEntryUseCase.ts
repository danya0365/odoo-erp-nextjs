import type { Invoice, JournalEntry } from "@/src/domain/entities";
import { invoiceEntryLines } from "@/src/domain/services/accounting";
import { postJournalEntry, type PostDeps } from "./postJournalEntry";

/** ลงบัญชีใบแจ้งหนี้ลูกค้า: DR ลูกหนี้ / CR รายได้ + ภาษีขาย (สมุดรายวันขาย) */
export class PostInvoiceJournalEntryUseCase {
  constructor(private readonly deps: PostDeps) {}

  async execute(invoice: Invoice): Promise<JournalEntry> {
    return postJournalEntry(this.deps, {
      shopId: invoice.shopId,
      journalType: "sale",
      sourceType: "invoice",
      sourceId: invoice.id,
      ref: invoice.docNumber,
      date: invoice.createdAt,
      partnerId: invoice.customerId,
      draft: invoiceEntryLines({
        untaxed: invoice.untaxedAmount,
        tax: invoice.taxAmount,
        total: invoice.totalAmount,
      }),
    });
  }
}
