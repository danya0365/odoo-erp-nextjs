// ตรรกะหน้าร้านออนไลน์ (pure) — สรุปตะกร้า + ตรวจอีเมล
import { computeLine, sumDocument, type DocumentTotals } from "@/src/domain/services/money";

export interface CartLineInput {
  qty: number; // scale QTY_SCALE
  unitPrice: number; // minor (snapshot)
  taxRateBp: number;
}

export interface CartLineComputed extends CartLineInput {
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

/** คำนวณบรรทัด + ยอดรวมตะกร้า (ปัดต่อบรรทัดแล้วรวม เหมือนเอกสารขาย) */
export function summarizeCart(
  lines: ReadonlyArray<CartLineInput>,
): { lines: CartLineComputed[]; totals: DocumentTotals } {
  const computed = lines.map((l) => {
    const t = computeLine(l.qty, l.unitPrice, l.taxRateBp);
    return { ...l, lineSubtotal: t.subtotal, lineTax: t.tax, lineTotal: t.total };
  });
  const totals = sumDocument(computed.map((l) => ({ subtotal: l.lineSubtotal, tax: l.lineTax })));
  return { lines: computed, totals };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}
