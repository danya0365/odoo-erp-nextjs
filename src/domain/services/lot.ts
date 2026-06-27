// ล็อต/วันหมดอายุ + จัดสรรแบบ FEFO (First-Expired-First-Out) — pure, ไม่มี I/O
export interface LotForAlloc {
  id: string;
  expiryDate: string; // "YYYY-MM-DD"
  qty: number; // scale QTY_SCALE
}

export interface Allocation {
  lotId: string;
  qty: number;
}

/** จัดสรรจำนวนที่จะตัดออกจากล็อตที่หมดอายุก่อน (FEFO) — โยน error ถ้าของไม่พอ */
export function allocateFefo(lots: readonly LotForAlloc[], requested: number): Allocation[] {
  if (requested <= 0) throw new Error("จำนวนต้องมากกว่า 0");
  const total = lots.reduce((s, l) => s + Math.max(0, l.qty), 0);
  if (total < requested) throw new Error("สต๊อกในล็อตไม่พอ");
  const sorted = [...lots].sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : a.expiryDate > b.expiryDate ? 1 : 0));
  const allocations: Allocation[] = [];
  let remaining = requested;
  for (const l of sorted) {
    if (remaining <= 0) break;
    if (l.qty <= 0) continue;
    const take = Math.min(l.qty, remaining);
    allocations.push({ lotId: l.id, qty: take });
    remaining -= take;
  }
  return allocations;
}

function daysUntil(expiryDate: string, asOf: string): number {
  const e = new Date(`${expiryDate}T00:00:00.000Z`).getTime();
  const a = new Date(asOf).getTime();
  return Math.floor((e - a) / 86_400_000);
}

export function isExpired(expiryDate: string, asOf: string): boolean {
  return daysUntil(expiryDate, asOf) < 0;
}

/** ใกล้หมดอายุภายใน withinDays (และยังไม่หมดอายุ) */
export function isExpiringSoon(expiryDate: string, asOf: string, withinDays: number): boolean {
  const d = daysUntil(expiryDate, asOf);
  return d >= 0 && d <= withinDays;
}
