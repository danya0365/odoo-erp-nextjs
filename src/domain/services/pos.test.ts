import { test } from "node:test";
import assert from "node:assert/strict";

import { expectedCash, cashDifference } from "./pos";

test("expectedCash = ตั้งต้น + ขายเงินสด", () => {
  assert.equal(expectedCash(100000, 250000), 350000);
  assert.equal(expectedCash(0, 0), 0);
});

test("cashDifference: เกิน/ขาด", () => {
  assert.equal(cashDifference(350000, 350000), 0); // ตรง
  assert.equal(cashDifference(351000, 350000), 1000); // เกิน
  assert.equal(cashDifference(349000, 350000), -1000); // ขาด
});
