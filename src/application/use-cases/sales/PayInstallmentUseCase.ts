import type { InstallmentLine, Payment } from "@/src/domain/entities";
import { isPlanComplete } from "@/src/domain/services/installment";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IInstallmentPlanRepository } from "@/src/application/repositories/IInstallmentPlanRepository";
import type { IInvoiceRepository } from "@/src/application/repositories/IInvoiceRepository";
import type { IPaymentRepository } from "@/src/application/repositories/IPaymentRepository";
import type { ISalesOrderRepository } from "@/src/application/repositories/ISalesOrderRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

/**
 * เก็บเงินงวด: สร้าง payment ผูกใบแจ้งหนี้ + อัปเดต amountPaid/สถานะ + mark งวดจ่ายแล้ว
 * ถ้าจ่ายครบทุกงวด → แผน completed (และ SO done ถ้าใบนี้ผูก SO)
 */
export class PayInstallmentUseCase {
  constructor(
    private readonly plans: IInstallmentPlanRepository,
    private readonly invoices: IInvoiceRepository,
    private readonly payments: IPaymentRepository,
    private readonly salesOrders: ISalesOrderRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(shopId: string, planId: string, lineId: string, now: string): Promise<Payment> {
    const plan = await this.plans.findById(shopId, planId);
    if (!plan) throw new Error("ไม่พบแผนผ่อนชำระ");
    const line = plan.lines.find((l) => l.id === lineId);
    if (!line) throw new Error("ไม่พบงวดผ่อน");
    if (line.status === "paid") throw new Error("งวดนี้ชำระแล้ว");

    const invoice = await this.invoices.findById(shopId, plan.invoiceId);
    if (!invoice) throw new Error("ไม่พบใบแจ้งหนี้");

    const seq = await this.sequences.next(shopId, "payment");
    const payment = await this.payments.create({
      shopId,
      docNumber: formatDocNumber("PAY", seq, 5),
      partnerId: invoice.customerId,
      direction: "inbound",
      invoiceId: invoice.id,
      amount: line.amount,
      method: "cash",
      paidAt: now,
    });

    const amountPaid = invoice.amountPaid + line.amount;
    const fullyPaid = amountPaid >= invoice.totalAmount;
    await this.invoices.update(shopId, invoice.id, {
      amountPaid,
      status: fullyPaid ? "paid" : invoice.status,
    });

    await this.plans.payLine(shopId, lineId, line.amount);

    // ตรวจว่าครบทุกงวดหรือยัง (รวมงวดที่เพิ่งจ่าย)
    const updatedLines: { status: InstallmentLine["status"] }[] = plan.lines.map((l) =>
      l.id === lineId ? { status: "paid" } : { status: l.status },
    );
    if (isPlanComplete(updatedLines)) {
      await this.plans.update(shopId, planId, { status: "completed" });
      if (fullyPaid && invoice.salesOrderId) {
        await this.salesOrders.update(shopId, invoice.salesOrderId, { status: "done" });
      }
    }
    return payment;
  }
}
