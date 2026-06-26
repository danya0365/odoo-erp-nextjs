import { vatSummary, type VatSummary } from "@/src/domain/services/tax";
import { ACCOUNT_CODES } from "@/src/domain/services/accounting";
import type { DateRange, IJournalEntryRepository } from "@/src/application/repositories/IJournalEntryRepository";

/** รายงานภาษีมูลค่าเพิ่ม (ภพ.30) งวดหนึ่ง — สรุปภาษีขาย/ซื้อจากสมุดรายวันในช่วงวันที่ */
export class GetVatReportUseCase {
  constructor(private readonly entries: IJournalEntryRepository) {}

  async execute(shopId: string, range: DateRange): Promise<VatSummary> {
    const rows = await this.entries.trialBalance(shopId, range);
    const byCode = new Map(rows.map((r) => [r.code, r]));
    const out = byCode.get(ACCOUNT_CODES.outputVat); // liability: ภาษีขาย = credit − debit
    const inp = byCode.get(ACCOUNT_CODES.inputVat); // asset: ภาษีซื้อ = debit − credit
    const outputVat = out ? out.credit - out.debit : 0;
    const inputVat = inp ? inp.debit - inp.credit : 0;
    return vatSummary(outputVat, inputVat);
  }
}
