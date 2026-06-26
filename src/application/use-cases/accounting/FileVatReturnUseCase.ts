import type { VatFiling } from "@/src/domain/entities";
import type { VatSummary } from "@/src/domain/services/tax";
import type { IVatFilingRepository } from "@/src/application/repositories/IVatFilingRepository";

/** บันทึกการยื่น ภพ.30 ของงวด (กันยื่นซ้ำงวดเดิม) */
export class FileVatReturnUseCase {
  constructor(private readonly filings: IVatFilingRepository) {}

  async execute(
    shopId: string,
    periodStart: string,
    periodEnd: string,
    summary: VatSummary,
    filedAt: string,
  ): Promise<VatFiling> {
    const existing = await this.filings.findByPeriod(shopId, periodStart);
    if (existing) throw new Error("ยื่นภาษีงวดนี้ไปแล้ว");
    return this.filings.create({
      shopId,
      periodStart,
      periodEnd,
      outputVat: summary.outputVat,
      inputVat: summary.inputVat,
      netPayable: summary.netPayable,
      filedAt,
    });
  }
}
