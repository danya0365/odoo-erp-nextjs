import { test } from "node:test";
import assert from "node:assert/strict";

import {
  monthKey,
  lastNMonths,
  zeroFillMonths,
  topN,
  percentShare,
  inventoryLineValue,
  sumBy,
} from "./reporting";

test("monthKey: ตัด 'YYYY-MM'", () => {
  assert.equal(monthKey("2026-06-18T10:00:00.000Z"), "2026-06");
});

test("lastNMonths: ข้ามปีถูกต้อง", () => {
  assert.deepEqual(lastNMonths("2026-02-15T00:00:00Z", 4), ["2025-11", "2025-12", "2026-01", "2026-02"]);
  assert.deepEqual(lastNMonths("2026-06-01T00:00:00Z", 1), ["2026-06"]);
});

test("zeroFillMonths: เติมเดือนที่ขาดด้วย 0 ตามลำดับ", () => {
  const out = zeroFillMonths(
    [{ month: "2026-02", total: 500 }],
    ["2026-01", "2026-02", "2026-03"],
  );
  assert.deepEqual(out, [
    { month: "2026-01", total: 0 },
    { month: "2026-02", total: 500 },
    { month: "2026-03", total: 0 },
  ]);
});

test("topN: เรียงมาก→น้อย + ไม่กลายพันธุ์ input", () => {
  const items = [{ v: 3 }, { v: 1 }, { v: 9 }, { v: 5 }];
  const top = topN(items, (x) => x.v, 2);
  assert.deepEqual(top.map((x) => x.v), [9, 5]);
  assert.deepEqual(items.map((x) => x.v), [3, 1, 9, 5]); // เดิมไม่เปลี่ยน
});

test("percentShare: ปัดจำนวนเต็ม + กัน total 0", () => {
  assert.equal(percentShare(25, 100), 25);
  assert.equal(percentShare(1, 3), 33); // 33.3 → 33
  assert.equal(percentShare(2, 3), 67); // 66.6 → 67
  assert.equal(percentShare(5, 0), 0);
});

test("inventoryLineValue: on-hand(สเกล1000) × ต้นทุน(minor)", () => {
  // 20 หน่วย (20000) × ต้นทุน 50.00 (5000) = 1000.00 (100000 minor)
  assert.equal(inventoryLineValue(20000, 5000), 100000);
  assert.equal(inventoryLineValue(1500, 10000), 15000); // 1.5 × 100.00 = 150.00
});

test("sumBy", () => {
  assert.equal(sumBy([{ a: 10 }, { a: 5 }, { a: 2 }], (x) => x.a), 17);
});
