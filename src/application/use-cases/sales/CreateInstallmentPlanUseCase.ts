import type { InstallmentPlan } from "@/src/domain/entities";
import { buildSchedule } from "@/src/domain/services/installment";
import type { IInstallmentPlanRepository } from "@/src/application/repositories/IInstallmentPlanRepository";
import type { IInvoiceRepository } from "@/src/application/repositories/IInvoiceRepository";

/** ตั้งแผนผ่อนชำระจากใบแจ้งหนี้ — แบ่ง N งวดเท่ากัน งวดแรก = มัดจำ (กันตั้งซ้ำต่อใบ) */
export class CreateInstallmentPlanUseCase {
  constructor(
    private readonly plans: IInstallmentPlanRepository,
    private readonly invoices: IInvoiceRepository,
  ) {}

  async execute(
    shopId: string,
    invoiceId: string,
    count: number,
    intervalDays: number,
    startIso: string,
  ): Promise<InstallmentPlan> {
    const invoice = await this.invoices.findById(shopId, invoiceId);
    if (!invoice) throw new Error("ไม่พบใบแจ้งหนี้");
    const existing = await this.plans.findByInvoice(shopId, invoiceId);
    if (existing) throw new Error("ใบแจ้งหนี้นี้มีแผนผ่อนชำระแล้ว");

    const schedule = buildSchedule(invoice.totalAmount, count, intervalDays, startIso);
    return this.plans.createWithLines({
      shopId,
      invoiceId,
      customerId: invoice.customerId,
      totalAmount: invoice.totalAmount,
      lines: schedule,
    });
  }
}
