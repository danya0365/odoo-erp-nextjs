// ตัวช่วยรวมข้อมูลรายงาน (pure) — ไม่มี I/O, ทดสอบได้
import { roundHalfUp, QTY_SCALE } from "@/src/domain/services/money";

/** 'YYYY-MM' จาก ISO-8601 */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** label เดือน n เดือนล่าสุดจนถึง endIso (เก่า→ใหม่) ด้วยเลขล้วน ไม่พึ่ง Date */
export function lastNMonths(endIso: string, n: number): string[] {
  let y = Number(endIso.slice(0, 4));
  let m = Number(endIso.slice(5, 7)); // 1–12
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.unshift(`${y}-${String(m).padStart(2, "0")}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return out;
}

export interface MonthBucket {
  month: string;
  total: number;
}

/** เติมเดือนที่ไม่มีข้อมูลด้วย 0 ตามลำดับ months ที่กำหนด */
export function zeroFillMonths(
  rows: ReadonlyArray<{ month: string; total: number }>,
  months: ReadonlyArray<string>,
): MonthBucket[] {
  const map = new Map(rows.map((r) => [r.month, r.total]));
  return months.map((month) => ({ month, total: map.get(month) ?? 0 }));
}

/** เรียงมาก→น้อยตามค่า แล้วตัด n อันดับแรก (ไม่กลายพันธุ์ input) */
export function topN<T>(items: ReadonlyArray<T>, value: (t: T) => number, n: number): T[] {
  return [...items].sort((a, b) => value(b) - value(a)).slice(0, Math.max(0, n));
}

/** สัดส่วน % (ปัดเป็นจำนวนเต็ม) — total ≤ 0 คืน 0 */
export function percentShare(value: number, total: number): number {
  if (total <= 0) return 0;
  return roundHalfUp((value * 100) / total);
}

/** มูลค่าสินค้าคงคลังต่อรายการ = on-hand (สเกล qty) × ต้นทุน/หน่วย (minor) → minor */
export function inventoryLineValue(onHandScaled: number, unitCostMinor: number): number {
  return roundHalfUp((onHandScaled * unitCostMinor) / QTY_SCALE);
}

export function sumBy<T>(items: ReadonlyArray<T>, value: (t: T) => number): number {
  return items.reduce((s, t) => s + value(t), 0);
}
