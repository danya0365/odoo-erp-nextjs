import { test } from "node:test";
import assert from "node:assert/strict";

import { discountAmount, pointsFromSpend } from "./promotion";

test("discountAmount percent: 10% ของ 1000 = 100", () => {
  assert.equal(discountAmount(100000, "percent", 10, 0), 10000);
});

test("discountAmount fixed: ลดคงที่", () => {
  assert.equal(discountAmount(100000, "fixed", 5000, 0), 5000);
});

test("discountAmount: ต่ำกว่าขั้นต่ำ → 0", () => {
  assert.equal(discountAmount(40000, "percent", 10, 50000), 0);
  assert.equal(discountAmount(60000, "percent", 10, 50000), 6000);
});

test("discountAmount: ไม่เกินยอดก่อนลด", () => {
  assert.equal(discountAmount(3000, "fixed", 9999, 0), 3000);
});

test("pointsFromSpend: 1 แต้มต่อ 100 บาท (floor)", () => {
  assert.equal(pointsFromSpend(25000, 10000), 2); // 250 บาท → 2 แต้ม
  assert.equal(pointsFromSpend(9900, 10000), 0);
  assert.equal(pointsFromSpend(100000, 10000), 10);
});
