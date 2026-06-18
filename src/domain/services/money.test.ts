import { test } from "node:test";
import assert from "node:assert/strict";

import {
  QTY_SCALE,
  roundHalfUp,
  lineSubtotal,
  lineTax,
  computeLine,
  sumDocument,
  parseScaled,
  formatScaled,
} from "./money";

test("roundHalfUp ปัดครึ่งขึ้นสมมาตร", () => {
  assert.equal(roundHalfUp(0.5), 1);
  assert.equal(roundHalfUp(1.4), 1);
  assert.equal(roundHalfUp(1.5), 2);
  assert.equal(roundHalfUp(-1.5), -2);
  assert.equal(roundHalfUp(2.49), 2);
});

test("lineSubtotal = qty(scaled) × ราคา/หน่วย", () => {
  // 2 หน่วย × 150 สตางค์ = 300
  assert.equal(lineSubtotal(2 * QTY_SCALE, 150), 300);
  // 1.5 หน่วย × 100 = 150
  assert.equal(lineSubtotal(1500, 100), 150);
  // 0.333 หน่วย × 100 = 33.3 → 33
  assert.equal(lineSubtotal(333, 100), 33);
});

test("lineTax จาก basis points", () => {
  assert.equal(lineTax(1000, 700), 70); // 7%
  assert.equal(lineTax(150, 700), 11); // 10.5 → 11
  assert.equal(lineTax(1000, 0), 0);
});

test("computeLine + sumDocument รวมยอดถูก (ปัดต่อบรรทัดแล้วรวม)", () => {
  const l1 = computeLine(1 * QTY_SCALE, 100, 700); // sub100 tax7 total107
  const l2 = computeLine(3 * QTY_SCALE, 50, 700); // sub150 tax11 total161 (10.5→11)
  assert.deepEqual(l1, { subtotal: 100, tax: 7, total: 107 });
  assert.deepEqual(l2, { subtotal: 150, tax: 11, total: 161 });
  const totals = sumDocument([l1, l2]);
  assert.deepEqual(totals, { untaxed: 250, tax: 18, total: 268 });
});

test("parseScaled: ทศนิยม → integer สเกล", () => {
  assert.equal(parseScaled("100.50", 100), 10050);
  assert.equal(parseScaled("100", 100), 10000);
  assert.equal(parseScaled("1.5", QTY_SCALE), 1500);
  assert.equal(parseScaled("0.333", QTY_SCALE), 333);
  assert.equal(parseScaled("1.999", 100), 199); // ตัดส่วนเกิน (ไม่ปัด)
  assert.throws(() => parseScaled("abc", 100), /ตัวเลขไม่ถูกต้อง/);
});

test("formatScaled: integer สเกล → ทศนิยม", () => {
  assert.equal(formatScaled(10050, 100), "100.50");
  assert.equal(formatScaled(1500, QTY_SCALE), "1.500");
  assert.equal(formatScaled(0, 100), "0.00");
});
