import { test } from "node:test";
import assert from "node:assert/strict";

import { onHandFromMoves, canApplyDelta } from "./stock";

test("onHandFromMoves รวม delta", () => {
  assert.equal(onHandFromMoves([]), 0);
  assert.equal(
    onHandFromMoves([{ qtyDelta: 5000 }, { qtyDelta: -2000 }, { qtyDelta: 1000 }]),
    4000,
  );
});

test("canApplyDelta กันติดลบ", () => {
  assert.equal(canApplyDelta(3000, -3000), true);
  assert.equal(canApplyDelta(3000, -3001), false);
  assert.equal(canApplyDelta(0, 5000), true); // เติมเข้าได้เสมอ
});
