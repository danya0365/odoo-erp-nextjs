import { test } from "node:test";
import assert from "node:assert/strict";

import {
  onHandFromMoves,
  canApplyDelta,
  needsReorder,
  reorderSuggestion,
  canTransfer,
} from "./stock";

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

test("needsReorder: on-hand ≤ ขั้นต่ำ", () => {
  assert.equal(needsReorder(5000, 5000), true); // เท่ากันก็ถึงจุดสั่ง
  assert.equal(needsReorder(4999, 5000), true);
  assert.equal(needsReorder(5001, 5000), false);
});

test("reorderSuggestion: เติมจนถึง max เมื่อถึงจุดสั่ง", () => {
  assert.equal(reorderSuggestion(2000, 5000, 20000), 18000); // 20000 - 2000
  assert.equal(reorderSuggestion(6000, 5000, 20000), 0); // ยังไม่ถึงจุดสั่ง
  assert.equal(reorderSuggestion(0, 0, 0), 0);
});

test("canTransfer: > 0 และไม่เกิน on-hand ต้นทาง", () => {
  assert.equal(canTransfer(10000, 5000), true);
  assert.equal(canTransfer(10000, 10000), true);
  assert.equal(canTransfer(10000, 10001), false);
  assert.equal(canTransfer(10000, 0), false);
  assert.equal(canTransfer(0, 1000), false);
});
