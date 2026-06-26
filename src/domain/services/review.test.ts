import { test } from "node:test";
import assert from "node:assert/strict";

import { isValidRating, ratingSummary, formatAverage } from "./review";

test("isValidRating: จำนวนเต็ม 1–5 เท่านั้น", () => {
  assert.equal(isValidRating(1), true);
  assert.equal(isValidRating(5), true);
  assert.equal(isValidRating(0), false);
  assert.equal(isValidRating(6), false);
  assert.equal(isValidRating(3.5), false);
});

test("ratingSummary: ค่าเฉลี่ย ×10 ปัดครึ่งขึ้น", () => {
  assert.deepEqual(ratingSummary([5, 4, 4]), { count: 3, averageX10: 43 }); // 4.333 → 43
  assert.deepEqual(ratingSummary([5, 2]), { count: 2, averageX10: 35 });
  assert.deepEqual(ratingSummary([]), { count: 0, averageX10: 0 });
});

test("formatAverage", () => {
  assert.equal(formatAverage(43), "4.3");
  assert.equal(formatAverage(50), "5.0");
  assert.equal(formatAverage(0), "0.0");
});
