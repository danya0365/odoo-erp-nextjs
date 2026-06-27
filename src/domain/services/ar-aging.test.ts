import { test } from "node:test";
import assert from "node:assert/strict";

import { agingBucket, daysBetween, summarizeAging, type AgingItem } from "./ar-aging";

test("agingBucket: ขอบเขตช่วงอายุ", () => {
  assert.equal(agingBucket(0), "current");
  assert.equal(agingBucket(-5), "current");
  assert.equal(agingBucket(1), "d1_30");
  assert.equal(agingBucket(30), "d1_30");
  assert.equal(agingBucket(31), "d31_60");
  assert.equal(agingBucket(60), "d31_60");
  assert.equal(agingBucket(90), "d61_90");
  assert.equal(agingBucket(91), "d90_plus");
});

test("daysBetween: นับเป็นวันเต็ม (UTC)", () => {
  assert.equal(daysBetween("2026-01-01T00:00:00.000Z", "2026-01-31T10:00:00.000Z"), 30);
  assert.equal(daysBetween("2026-01-10", "2026-01-01"), -9);
});

test("summarizeAging: รวมยอดค้างต่อลูกค้าเข้าช่องอายุ + ข้ามยอด ≤0", () => {
  const asOf = "2026-03-01T00:00:00.000Z";
  const items: AgingItem[] = [
    { customerId: "c1", customerName: "A", outstanding: 1000, dueDate: "2026-02-28" }, // 1 วัน → d1_30
    { customerId: "c1", customerName: "A", outstanding: 500, dueDate: "2026-03-10" }, // ยังไม่ครบ → current
    { customerId: "c2", customerName: "B", outstanding: 2000, dueDate: "2025-11-01" }, // >90 → d90_plus
    { customerId: "c2", customerName: "B", outstanding: 0, dueDate: "2026-01-01" }, // ข้าม
  ];
  const s = summarizeAging(items, asOf);
  assert.equal(s.grandTotal, 3500);
  assert.equal(s.rows.length, 2);
  // เรียงตามยอดรวมมาก→น้อย: B(2000) ก่อน A(1500)
  assert.equal(s.rows[0].customerId, "c2");
  assert.equal(s.rows[0].buckets.d90_plus, 2000);
  const a = s.rows.find((r) => r.customerId === "c1")!;
  assert.equal(a.buckets.d1_30, 1000);
  assert.equal(a.buckets.current, 500);
  assert.equal(a.total, 1500);
  assert.equal(s.totals.d90_plus, 2000);
});
