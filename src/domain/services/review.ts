// ตรรกะรีวิวร้าน (pure)
import { roundHalfUp } from "@/src/domain/services/money";

export const MIN_RATING = 1;
export const MAX_RATING = 5;

export function isValidRating(n: number): boolean {
  return Number.isInteger(n) && n >= MIN_RATING && n <= MAX_RATING;
}

export interface RatingSummary {
  count: number;
  averageX10: number; // ค่าเฉลี่ย × 10 (integer) เช่น 4.3 = 43
}

/** สรุปคะแนนจากรายการ rating — เก็บค่าเฉลี่ยเป็น integer ×10 เลี่ยง float */
export function ratingSummary(ratings: ReadonlyArray<number>): RatingSummary {
  if (ratings.length === 0) return { count: 0, averageX10: 0 };
  const sum = ratings.reduce((s, r) => s + r, 0);
  return { count: ratings.length, averageX10: roundHalfUp((sum * 10) / ratings.length) };
}

/** 43 → "4.3" */
export function formatAverage(averageX10: number): string {
  return (averageX10 / 10).toFixed(1);
}
