import type { SalesReturn } from "@/src/domain/entities";
import { canRefund } from "@/src/domain/services/sales-return-status";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { ISalesReturnRepository } from "@/src/application/repositories/ISalesReturnRepository";
import type { IPaymentRepository } from "@/src/application/repositories/IPaymentRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

/** คืนเงินลูกค้าตามใบลดหนี้: สร้าง payment outbound + สถานะ refunded (จ่ายเต็มยอด) */
export class RefundSalesReturnUseCase {
  constructor(
    private readonly salesReturns: ISalesReturnRepository,
    private readonly payments: IPaymentRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(shopId: string, id: string, method: string, now: string): Promise<SalesReturn> {
    const ret = await this.salesReturns.findById(shopId, id);
    if (!ret) throw new Error("ไม่พบใบคืนสินค้า");
    if (!canRefund(ret.status)) throw new Error("คืนเงินได้เฉพาะใบที่ออกใบลดหนี้แล้ว");

    const seq = await this.sequences.next(shopId, "payment");
    await this.payments.create({
      shopId,
      docNumber: formatDocNumber("PAY", seq, 5),
      partnerId: ret.customerId,
      direction: "outbound",
      invoiceId: null,
      amount: ret.totalAmount,
      method,
      paidAt: now,
    });

    return this.salesReturns.update(shopId, id, {
      status: "refunded",
      refundedAmount: ret.totalAmount,
    });
  }
}
