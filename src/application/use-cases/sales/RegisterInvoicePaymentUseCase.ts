import type { Payment } from "@/src/domain/entities";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IInvoiceRepository } from "@/src/application/repositories/IInvoiceRepository";
import type { IPaymentRepository } from "@/src/application/repositories/IPaymentRepository";
import type { ISalesOrderRepository } from "@/src/application/repositories/ISalesOrderRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

/** รับชำระใบแจ้งหนี้: สร้าง payment + อัปเดต amountPaid/สถานะ; ถ้าชำระครบ → SO = done */
export class RegisterInvoicePaymentUseCase {
  constructor(
    private readonly invoices: IInvoiceRepository,
    private readonly payments: IPaymentRepository,
    private readonly salesOrders: ISalesOrderRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(
    shopId: string,
    invoiceId: string,
    amount: number,
    method: string,
    now: string,
  ): Promise<Payment> {
    const invoice = await this.invoices.findById(shopId, invoiceId);
    if (!invoice) throw new Error("ไม่พบใบแจ้งหนี้");
    if (invoice.status === "paid") throw new Error("ใบแจ้งหนี้นี้ชำระครบแล้ว");
    if (amount <= 0) throw new Error("จำนวนเงินต้องมากกว่า 0");

    const seq = await this.sequences.next(shopId, "payment");
    const payment = await this.payments.create({
      shopId,
      docNumber: formatDocNumber("PAY", seq, 5),
      partnerId: invoice.customerId,
      direction: "inbound",
      invoiceId: invoice.id,
      amount,
      method,
      paidAt: now,
    });

    const amountPaid = invoice.amountPaid + amount;
    const fullyPaid = amountPaid >= invoice.totalAmount;
    await this.invoices.update(shopId, invoiceId, {
      amountPaid,
      status: fullyPaid ? "paid" : invoice.status,
    });

    if (fullyPaid && invoice.salesOrderId) {
      await this.salesOrders.update(shopId, invoice.salesOrderId, { status: "done" });
    }
    return payment;
  }
}
