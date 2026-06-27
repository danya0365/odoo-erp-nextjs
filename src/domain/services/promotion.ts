// โปรโมชั่น/ส่วนลด + แต้มสะสม — pure, ไม่มี I/O · เงินเป็น integer minor units
import { roundHalfUp } from "@/src/domain/services/money";

export type DiscountType = "percent" | "fixed";

/**
 * ส่วนลดจากโปรโมชั่น (0 ถ้ายังไม่เข้าเงื่อนไขขั้นต่ำ)
 * - percent: value = เปอร์เซ็นต์ (0–100)
 * - fixed: value = ส่วนลดคงที่ (minor units)
 * ส่วนลดไม่เกินยอดก่อนลด
 */
export function discountAmount(subtotal: number, type: DiscountType, value: number, minSpend: number): number {
  if (subtotal < minSpend) return 0;
  const raw = type === "percent" ? roundHalfUp((subtotal * value) / 100) : value;
  return Math.max(0, Math.min(raw, subtotal));
}

/** แต้มที่ได้จากยอดซื้อ = floor(ยอด / อัตราต่อแต้ม) — อัตราเป็น minor units ต่อ 1 แต้ม */
export function pointsFromSpend(amount: number, ratePerPoint: number): number {
  if (ratePerPoint <= 0) return 0;
  return Math.floor(amount / ratePerPoint);
}

/** อัตราเริ่มต้น: 1 แต้มต่อการใช้จ่าย 100 บาท (10000 สตางค์) */
export const DEFAULT_POINT_RATE = 10000;
