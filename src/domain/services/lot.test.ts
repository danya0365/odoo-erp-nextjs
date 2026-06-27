import { test } from "node:test";
import assert from "node:assert/strict";

import { allocateFefo, isExpired, isExpiringSoon, type LotForAlloc } from "./lot";

const lots: LotForAlloc[] = [
  { id: "B", expiryDate: "2026-06-01", qty: 3000 },
  { id: "A", expiryDate: "2026-03-01", qty: 2000 }, // หมดอายุก่อน → ตัดก่อน
  { id: "C", expiryDate: "2026-09-01", qty: 5000 },
];

test("allocateFefo: ตัดล็อตที่หมดอายุก่อนเป็นอันดับแรก", () => {
  const alloc = allocateFefo(lots, 4000); // 2 จาก A หมดก่อน, อีก 2 จาก B
  assert.deepEqual(alloc, [
    { lotId: "A", qty: 2000 },
    { lotId: "B", qty: 2000 },
  ]);
});

test("allocateFefo: พอดีหลายล็อต", () => {
  const alloc = allocateFefo(lots, 10000); // 2000+3000+5000
  assert.equal(alloc.reduce((s, a) => s + a.qty, 0), 10000);
  assert.equal(alloc.length, 3);
});

test("allocateFefo: ของไม่พอ → error", () => {
  assert.throws(() => allocateFefo(lots, 99999), /ไม่พอ/);
  assert.throws(() => allocateFefo(lots, 0), /มากกว่า 0/);
});

test("isExpired / isExpiringSoon", () => {
  const asOf = "2026-03-01T00:00:00.000Z";
  assert.equal(isExpired("2026-02-28", asOf), true);
  assert.equal(isExpired("2026-03-10", asOf), false);
  assert.equal(isExpiringSoon("2026-03-20", asOf, 30), true); // 19 วัน
  assert.equal(isExpiringSoon("2026-05-01", asOf, 30), false); // ไกลเกิน
  assert.equal(isExpiringSoon("2026-02-28", asOf, 30), false); // หมดอายุแล้ว ไม่นับ soon
});
