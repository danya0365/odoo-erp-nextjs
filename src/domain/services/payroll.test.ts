import { test } from "node:test";
import assert from "node:assert/strict";

import { computePayslip, payrollTotals } from "./payroll";

test("computePayslip: ภาษีหัก ณ ที่จ่าย 3% + สุทธิ", () => {
  // เงินเดือน 30,000.00 (3000000) หัก 3% = 900.00 (90000) → สุทธิ 29,100.00
  const s = computePayslip(3000000, 300);
  assert.equal(s.gross, 3000000);
  assert.equal(s.tax, 90000);
  assert.equal(s.net, 2910000);
});

test("computePayslip: ไม่มีภาษี (0 bp) → net = gross", () => {
  const s = computePayslip(2000000, 0);
  assert.equal(s.tax, 0);
  assert.equal(s.net, 2000000);
});

test("payrollTotals: รวมทุกสลิป", () => {
  const t = payrollTotals([
    { gross: 3000000, tax: 90000, net: 2910000 },
    { gross: 2000000, tax: 60000, net: 1940000 },
  ]);
  assert.equal(t.gross, 5000000);
  assert.equal(t.tax, 150000);
  assert.equal(t.net, 4850000);
});
