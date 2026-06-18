import type { Payment } from "@/src/domain/entities";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IVendorBillRepository } from "@/src/application/repositories/IVendorBillRepository";
import type { IPaymentRepository } from "@/src/application/repositories/IPaymentRepository";
import type { IPurchaseOrderRepository } from "@/src/application/repositories/IPurchaseOrderRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

/** จ่ายเงินผู้ขาย (outbound): สร้าง payment + อัปเดต bill; ถ้าจ่ายครบ → PO = done */
export class RegisterBillPaymentUseCase {
  constructor(
    private readonly vendorBills: IVendorBillRepository,
    private readonly payments: IPaymentRepository,
    private readonly purchaseOrders: IPurchaseOrderRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(
    shopId: string,
    vendorBillId: string,
    amount: number,
    method: string,
    now: string,
  ): Promise<Payment> {
    const bill = await this.vendorBills.findById(shopId, vendorBillId);
    if (!bill) throw new Error("ไม่พบใบตั้งหนี้");
    if (bill.status === "paid") throw new Error("ใบตั้งหนี้นี้จ่ายครบแล้ว");
    if (amount <= 0) throw new Error("จำนวนเงินต้องมากกว่า 0");

    const seq = await this.sequences.next(shopId, "payment");
    const payment = await this.payments.create({
      shopId,
      docNumber: formatDocNumber("PAY", seq, 5),
      partnerId: bill.vendorId,
      direction: "outbound",
      vendorBillId: bill.id,
      amount,
      method,
      paidAt: now,
    });

    const amountPaid = bill.amountPaid + amount;
    const fullyPaid = amountPaid >= bill.totalAmount;
    await this.vendorBills.update(shopId, vendorBillId, {
      amountPaid,
      status: fullyPaid ? "paid" : bill.status,
    });

    if (fullyPaid && bill.purchaseOrderId) {
      await this.purchaseOrders.update(shopId, bill.purchaseOrderId, { status: "done" });
    }
    return payment;
  }
}
