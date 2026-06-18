import type { PosOrder, PosPaymentMethod } from "@/src/domain/entities";
import { computeLine, sumDocument } from "@/src/domain/services/money";
import { canApplyDelta } from "@/src/domain/services/stock";
import { cashSaleEntryLines } from "@/src/domain/services/accounting";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IPosSessionRepository } from "@/src/application/repositories/IPosSessionRepository";
import type {
  CreatePosOrderLineInput,
  IPosOrderRepository,
} from "@/src/application/repositories/IPosOrderRepository";
import type { IStockMoveRepository, StockMoveInput } from "@/src/application/repositories/IStockMoveRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";
import { postJournalEntry, type PostDeps } from "@/src/application/use-cases/accounting/postJournalEntry";

export interface CheckoutLine {
  productId: string;
  description: string;
  qty: number; // scale QTY_SCALE
  unitPrice: number; // minor (snapshot)
  taxRateBp: number;
  isStockable: boolean;
}

export interface CheckoutInput {
  shopId: string;
  sessionId: string;
  paymentMethod: PosPaymentMethod;
  lines: CheckoutLine[];
  now: string;
}

/**
 * ปิดการขายหน้าร้าน (cross-module orchestration ในจังหวะเดียว):
 * สร้าง POS order + ตัดสต๊อก OUT (สินค้านับสต๊อก) + ลงบัญชีขายสด — ทั้งหมดผ่าน use case นี้
 */
export class CheckoutPosOrderUseCase {
  constructor(
    private readonly sessions: IPosSessionRepository,
    private readonly posOrders: IPosOrderRepository,
    private readonly stockMoves: IStockMoveRepository,
    private readonly locations: IStockLocationRepository,
    private readonly sequences: ISequenceRepository,
    private readonly postDeps: PostDeps,
  ) {}

  async execute(input: CheckoutInput): Promise<PosOrder> {
    const session = await this.sessions.findById(input.shopId, input.sessionId);
    if (!session) throw new Error("ไม่พบกะ");
    if (session.status !== "open") throw new Error("กะนี้ปิดแล้ว");
    if (input.lines.length === 0) throw new Error("ไม่มีรายการสินค้า");

    // คำนวณบรรทัด/เอกสาร
    const lines: CreatePosOrderLineInput[] = input.lines.map((l) => {
      if (l.qty <= 0) throw new Error("จำนวนต้องมากกว่า 0");
      const t = computeLine(l.qty, l.unitPrice, l.taxRateBp);
      return {
        productId: l.productId,
        description: l.description,
        qty: l.qty,
        unitPrice: l.unitPrice,
        taxRateBp: l.taxRateBp,
        lineSubtotal: t.subtotal,
        lineTax: t.tax,
        lineTotal: t.total,
      };
    });
    const doc = sumDocument(lines.map((l) => ({ subtotal: l.lineSubtotal, tax: l.lineTax })));

    // กันขายเกินสต๊อก (เฉพาะสินค้านับสต๊อก)
    const location = await this.locations.ensureDefault(input.shopId);
    const moves: StockMoveInput[] = [];
    for (const l of input.lines) {
      if (!l.isStockable) continue;
      const onHand = await this.stockMoves.onHandByProduct(input.shopId, l.productId);
      if (!canApplyDelta(onHand, -l.qty)) {
        throw new Error(`สต๊อกไม่พอสำหรับ ${l.description}`);
      }
      moves.push({
        shopId: input.shopId,
        productId: l.productId,
        locationId: location.id,
        qtyDelta: -l.qty,
        type: "out",
        sourceType: "delivery",
        sourceId: input.sessionId,
      });
    }

    const seq = await this.sequences.next(input.shopId, "pos_order");
    const order = await this.posOrders.createWithLines({
      shopId: input.shopId,
      sessionId: input.sessionId,
      docNumber: formatDocNumber("POS", seq, 5),
      untaxedAmount: doc.untaxed,
      taxAmount: doc.tax,
      totalAmount: doc.total,
      paymentMethod: input.paymentMethod,
      lines,
    });

    if (moves.length > 0) await this.stockMoves.appendMany(moves);

    // ลงบัญชีขายสด (DR เงินสด / CR รายได้ + ภาษีขาย)
    await postJournalEntry(this.postDeps, {
      shopId: input.shopId,
      journalType: "sale",
      sourceType: "pos",
      sourceId: order.id,
      ref: order.docNumber,
      date: input.now,
      partnerId: null,
      draft: cashSaleEntryLines({ untaxed: doc.untaxed, tax: doc.tax, total: doc.total }),
    });

    return order;
  }
}
