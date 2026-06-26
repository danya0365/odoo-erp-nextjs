import { test } from "node:test";
import assert from "node:assert/strict";

import {
  canConfirm,
  canRefund,
  canCancel,
  assertReturnTransition,
} from "./sales-return-status";

test("canConfirm: เฉพาะ draft", () => {
  assert.equal(canConfirm("draft"), true);
  assert.equal(canConfirm("credited"), false);
  assert.equal(canConfirm("refunded"), false);
});

test("canRefund: เฉพาะ credited", () => {
  assert.equal(canRefund("credited"), true);
  assert.equal(canRefund("draft"), false);
  assert.equal(canRefund("refunded"), false);
});

test("canCancel: เฉพาะ draft", () => {
  assert.equal(canCancel("draft"), true);
  assert.equal(canCancel("credited"), false);
});

test("transition graph: draft→credited→refunded ถูก, ข้ามขั้นผิด", () => {
  assert.doesNotThrow(() => assertReturnTransition("draft", "credited"));
  assert.doesNotThrow(() => assertReturnTransition("credited", "refunded"));
  assert.throws(() => assertReturnTransition("draft", "refunded"), /เปลี่ยนสถานะ/);
  assert.throws(() => assertReturnTransition("refunded", "credited"), /เปลี่ยนสถานะ/);
});
