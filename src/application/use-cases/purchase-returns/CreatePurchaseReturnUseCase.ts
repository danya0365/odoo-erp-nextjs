import type { PurchaseReturn } from "@/src/domain/entities";
import { computeLine, sumDocument } from "@/src/domain/services/money";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IPurchaseReturnRepository } from "@/src/application/repositories/IPurchaseReturnRepository";
import type { IVendorBillRepository } from "@/src/application/repositories/IVendorBillRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

export interface PurchaseReturnLineInput {
  billLineId: string;
  qty: number; // scale QTY_SCALE
}

/** สร้างใบคืนของผู้ขาย (draft) จากใบตั้งหนี้ + ผล QC — snapshot ราคา/ภาษีจากบรรทัดใบตั้งหนี้ */
export class CreatePurchaseReturnUseCase {
  constructor(
    private readonly returns: IPurchaseReturnRepository,
    private readonly bills: IVendorBillRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(
    shopId: string,
    vendorBillId: string,
    lines: PurchaseReturnLineInput[],
    reason: string | null,
  ): Promise<PurchaseReturn> {
    const bill = await this.bills.findById(shopId, vendorBillId);
    if (!bill) throw new Error("ไม่พบใบตั้งหนี้ผู้ขาย");
    if (bill.status === "cancelled") throw new Error("ใบตั้งหนี้นี้ถูกยกเลิกแล้ว");

    const billLines = await this.bills.listLines(shopId, vendorBillId);
    const requested = lines.filter((l) => l.qty > 0);
    if (requested.length === 0) throw new Error("ไม่มีจำนวนที่จะคืน");

    const returnLines = requested.map((r) => {
      const bl = billLines.find((l) => l.id === r.billLineId);
      if (!bl) throw new Error("ไม่พบรายการในใบตั้งหนี้");
      if (r.qty > bl.qty) throw new Error("จำนวนคืนเกินจำนวนในใบตั้งหนี้");
      const c = computeLine(r.qty, bl.unitPrice, bl.taxRateBp);
      return {
        productId: bl.productId,
        description: bl.description,
        qty: r.qty,
        unitPrice: bl.unitPrice,
        taxRateBp: bl.taxRateBp,
        lineSubtotal: c.subtotal,
        lineTax: c.tax,
        lineTotal: c.total,
      };
    });

    const totals = sumDocument(returnLines.map((l) => ({ subtotal: l.lineSubtotal, tax: l.lineTax })));
    const seq = await this.sequences.next(shopId, "vendor_credit");

    return this.returns.createWithLines({
      shopId,
      docNumber: formatDocNumber("VCN", seq, 5),
      vendorBillId: bill.id,
      purchaseOrderId: bill.purchaseOrderId,
      vendorId: bill.vendorId,
      status: "draft",
      currency: bill.currency,
      untaxedAmount: totals.untaxed,
      taxAmount: totals.tax,
      totalAmount: totals.total,
      reason,
      lines: returnLines,
    });
  }
}
