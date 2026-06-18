import { test } from "node:test";
import assert from "node:assert/strict";

import { summarizeCart, isValidEmail } from "./storefront";

test("summarizeCart: คำนวณบรรทัด + รวม (ปัดต่อบรรทัด)", () => {
  // 2 หน่วย × 100.00 (7%) + 1 หน่วย × 50.00 (0%)
  const { lines, totals } = summarizeCart([
    { qty: 2000, unitPrice: 10000, taxRateBp: 700 },
    { qty: 1000, unitPrice: 5000, taxRateBp: 0 },
  ]);
  assert.equal(lines[0].lineSubtotal, 20000);
  assert.equal(lines[0].lineTax, 1400);
  assert.equal(lines[0].lineTotal, 21400);
  assert.equal(totals.untaxed, 25000); // 20000 + 5000
  assert.equal(totals.tax, 1400);
  assert.equal(totals.total, 26400);
});

test("summarizeCart: ตะกร้าว่าง → ศูนย์", () => {
  const { lines, totals } = summarizeCart([]);
  assert.equal(lines.length, 0);
  assert.equal(totals.total, 0);
});

test("isValidEmail", () => {
  assert.equal(isValidEmail("a@b.com"), true);
  assert.equal(isValidEmail("  user@shop.co.th "), true);
  assert.equal(isValidEmail("nope"), false);
  assert.equal(isValidEmail("a@b"), false);
});
