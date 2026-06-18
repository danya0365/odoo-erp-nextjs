import {
  lastNMonths,
  zeroFillMonths,
  type MonthBucket,
} from "@/src/domain/services/reporting";
import type {
  DocSummary,
  IReportingRepository,
  TopProductRow,
} from "@/src/application/repositories/IReportingRepository";

export interface SalesReportResult {
  summary: DocSummary;
  months: MonthBucket[]; // 6 เดือนล่าสุด เติม 0
  topProducts: TopProductRow[];
}

/** รายงานการขาย: สรุปยอด + ยอดต่อเดือน (6 เดือน) + สินค้าขายดี 5 อันดับ */
export class GetSalesReportUseCase {
  constructor(private readonly reporting: IReportingRepository) {}

  async execute(shopId: string, now: string): Promise<SalesReportResult> {
    const [summary, byMonth, topProducts] = await Promise.all([
      this.reporting.salesSummary(shopId),
      this.reporting.salesByMonth(shopId),
      this.reporting.topProducts(shopId, 5),
    ]);
    const months = zeroFillMonths(byMonth, lastNMonths(now, 6));
    return { summary, months, topProducts };
  }
}
