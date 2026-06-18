import { test } from "node:test";
import assert from "node:assert/strict";

import {
  canConfirm,
  canReceive,
  canBill,
  canCancel,
  statusAfterReceipt,
  assertPurchaseTransition,
} from "./purchase-order-status";

test("guards ต่อสถานะ", () => {
  assert.equal(canConfirm("rfq"), true);
  assert.equal(canConfirm("confirmed"), false);
  assert.equal(canReceive("confirmed"), true);
  assert.equal(canReceive("partially_received"), true);
  assert.equal(canReceive("rfq"), false);
  assert.equal(canBill("received"), true);
  assert.equal(canBill("confirmed"), false);
  assert.equal(canCancel("rfq"), true);
  assert.equal(canCancel("received"), false);
});

test("statusAfterReceipt: partial vs full", () => {
  assert.equal(statusAfterReceipt([{ ordered: 1000, done: 400 }]), "partially_received");
  assert.equal(statusAfterReceipt([{ ordered: 1000, done: 1000 }]), "received");
});

test("assertPurchaseTransition กันข้ามขั้น", () => {
  assert.doesNotThrow(() => assertPurchaseTransition("rfq", "confirmed"));
  assert.doesNotThrow(() => assertPurchaseTransition("received", "billed"));
  assert.throws(() => assertPurchaseTransition("rfq", "received"), /เปลี่ยนสถานะ/);
});
