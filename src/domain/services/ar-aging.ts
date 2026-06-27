// อายุลูกหนี้ (AR aging) — pure, ไม่มี I/O · จำนวนเป็น integer minor units
export type AgingBucket = "current" | "d1_30" | "d31_60" | "d61_90" | "d90_plus";

export const AGING_BUCKETS: readonly AgingBucket[] = ["current", "d1_30", "d31_60", "d61_90", "d90_plus"];

export const AGING_LABELS: Record<AgingBucket, string> = {
  current: "ยังไม่ครบกำหนด",
  d1_30: "เกิน 1–30 วัน",
  d31_60: "เกิน 31–60 วัน",
  d61_90: "เกิน 61–90 วัน",
  d90_plus: "เกิน 90 วัน",
};

/** จำนวนวันเต็มจาก from → to (อิง UTC date) */
export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.UTC(...isoParts(fromIso));
  const b = Date.UTC(...isoParts(toIso));
  return Math.floor((b - a) / 86_400_000);
}

function isoParts(iso: string): [number, number, number] {
  const d = new Date(iso);
  return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()];
}

/** จัดกลุ่มจากจำนวนวันที่เลยกำหนด (≤0 = ยังไม่ครบกำหนด) */
export function agingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return "current";
  if (daysOverdue <= 30) return "d1_30";
  if (daysOverdue <= 60) return "d31_60";
  if (daysOverdue <= 90) return "d61_90";
  return "d90_plus";
}

export interface AgingItem {
  customerId: string;
  customerName: string;
  outstanding: number;
  dueDate: string;
}

export interface AgingRow {
  customerId: string;
  customerName: string;
  buckets: Record<AgingBucket, number>;
  total: number;
}

function emptyBuckets(): Record<AgingBucket, number> {
  return { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0 };
}

export interface AgingSummary {
  rows: AgingRow[];
  totals: Record<AgingBucket, number>;
  grandTotal: number;
}

/** สรุปอายุลูกหนี้ ณ วันที่ asOf — รวมยอดค้างต่อลูกค้าเข้าช่องอายุ */
export function summarizeAging(items: readonly AgingItem[], asOf: string): AgingSummary {
  const byCustomer = new Map<string, AgingRow>();
  const totals = emptyBuckets();
  for (const it of items) {
    if (it.outstanding <= 0) continue;
    const bucket = agingBucket(daysBetween(it.dueDate, asOf));
    let row = byCustomer.get(it.customerId);
    if (!row) {
      row = { customerId: it.customerId, customerName: it.customerName, buckets: emptyBuckets(), total: 0 };
      byCustomer.set(it.customerId, row);
    }
    row.buckets[bucket] += it.outstanding;
    row.total += it.outstanding;
    totals[bucket] += it.outstanding;
  }
  const rows = [...byCustomer.values()].sort((a, b) => b.total - a.total);
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  return { rows, totals, grandTotal };
}
