import { summarizeAging, type AgingItem, type AgingSummary } from "@/src/domain/services/ar-aging";
import type { IInvoiceRepository } from "@/src/application/repositories/IInvoiceRepository";
import type { IPartnerRepository } from "@/src/application/repositories/IPartnerRepository";

/** รายงานอายุลูกหนี้ ณ วันที่ asOf — จากใบแจ้งหนี้ที่ยังค้างชำระ */
export class GetArAgingUseCase {
  constructor(
    private readonly invoices: IInvoiceRepository,
    private readonly partners: IPartnerRepository,
  ) {}

  async execute(shopId: string, asOf: string): Promise<AgingSummary> {
    const outstanding = await this.invoices.listOutstanding(shopId);
    const nameCache = new Map<string, string>();
    const items: AgingItem[] = [];
    for (const inv of outstanding) {
      const due = inv.totalAmount - inv.amountPaid;
      if (due <= 0) continue;
      let name = nameCache.get(inv.customerId);
      if (name === undefined) {
        const p = await this.partners.findById(shopId, inv.customerId);
        name = p?.name ?? "—";
        nameCache.set(inv.customerId, name);
      }
      items.push({
        customerId: inv.customerId,
        customerName: name,
        outstanding: due,
        dueDate: inv.dueDate ?? inv.createdAt,
      });
    }
    return summarizeAging(items, asOf);
  }
}
