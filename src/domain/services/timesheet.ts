// ตรรกะลงเวลา (pure) — เก็บเป็น "นาที" (integer) เลี่ยง float
import { roundHalfUp } from "@/src/domain/services/money";

/** "1.5" (ชั่วโมง) → 90 นาที; โยน error ถ้ารูปแบบผิด/≤ 0 */
export function parseHours(input: string): number {
  const t = input.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) throw new Error("จำนวนชั่วโมงไม่ถูกต้อง");
  const minutes = roundHalfUp(Number(t) * 60);
  if (minutes <= 0) throw new Error("จำนวนชั่วโมงต้องมากกว่า 0");
  return minutes;
}

/** 90 → "1.50" (ชั่วโมง) */
export function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

export function sumMinutes(entries: ReadonlyArray<{ minutes: number }>): number {
  return entries.reduce((s, e) => s + e.minutes, 0);
}
