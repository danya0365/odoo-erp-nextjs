import type { PosOrder, PosOrderWithLines, PosPaymentMethod } from "@/src/domain/entities";

export interface CreatePosOrderLineInput {
  productId: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface CreatePosOrderInput {
  shopId: string;
  sessionId: string;
  docNumber: string;
  untaxedAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PosPaymentMethod;
  lines: CreatePosOrderLineInput[];
}

export interface IPosOrderRepository {
  createWithLines(input: CreatePosOrderInput): Promise<PosOrder>;
  findById(shopId: string, id: string): Promise<PosOrderWithLines | null>;
  listBySession(shopId: string, sessionId: string): Promise<PosOrder[]>;
  /** ยอดขายเงินสดรวมในกะ (สำหรับกระทบเงินสดตอนปิด) */
  cashTotalBySession(shopId: string, sessionId: string): Promise<number>;
}
