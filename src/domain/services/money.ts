// เงินทั้งหมดเป็น integer "minor units" (เช่น สตางค์); ปริมาณเป็น integer สเกล QTY_SCALE (3 ตำแหน่ง)
// ปัดเศษ "ต่อบรรทัดแล้วค่อยรวม" (round_globally=false แบบ Odoo) — pure, ไม่มี I/O
export const QTY_SCALE = 1000; // 1.5 หน่วย = 1500

/** ปัดครึ่งขึ้นแบบสมมาตร (away from zero) คืนค่า integer */
export function roundHalfUp(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** ยอดก่อนภาษีต่อบรรทัด = qty(scaled) × ราคา/หน่วย (minor) */
export function lineSubtotal(qtyScaled: number, unitPrice: number): number {
  return roundHalfUp((qtyScaled * unitPrice) / QTY_SCALE);
}

/** ภาษีต่อบรรทัดจาก basis points (700 = 7%) */
export function lineTax(subtotal: number, taxRateBp: number): number {
  return roundHalfUp((subtotal * taxRateBp) / 10000);
}

export function lineTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}

export interface DocumentTotals {
  untaxed: number;
  tax: number;
  total: number;
}

/** รวมเอกสารจากบรรทัดที่ปัดเศษมาแล้ว */
export function sumDocument(
  lines: ReadonlyArray<{ subtotal: number; tax: number }>,
): DocumentTotals {
  const untaxed = lines.reduce((s, l) => s + l.subtotal, 0);
  const tax = lines.reduce((s, l) => s + l.tax, 0);
  return { untaxed, tax, total: untaxed + tax };
}

/** คำนวณบรรทัดครบชุดจาก input ดิบ (qty scaled, ราคา minor, ภาษี bp) */
export function computeLine(
  qtyScaled: number,
  unitPrice: number,
  taxRateBp: number,
): { subtotal: number; tax: number; total: number } {
  const subtotal = lineSubtotal(qtyScaled, unitPrice);
  const tax = lineTax(subtotal, taxRateBp);
  return { subtotal, tax, total: lineTotal(subtotal, tax) };
}
