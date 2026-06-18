import { test } from "node:test";
import assert from "node:assert/strict";

import {
  canConfirm,
  canDeliver,
  canInvoice,
  canCancel,
  statusAfterDelivery,
  assertSalesTransition,
} from "./sales-order-status";

test("guards ต่อสถานะ", () => {
  assert.equal(canConfirm("draft"), true);
  assert.equal(canConfirm("confirmed"), false);
  assert.equal(canDeliver("confirmed"), true);
  assert.equal(canDeliver("partially_delivered"), true);
  assert.equal(canDeliver("draft"), false);
  assert.equal(canInvoice("delivered"), true);
  assert.equal(canInvoice("confirmed"), false);
  assert.equal(canCancel("draft"), true);
  assert.equal(canCancel("delivered"), false);
});

test("statusAfterDelivery: partial vs full", () => {
  assert.equal(
    statusAfterDelivery([{ ordered: 1000, done: 500 }]),
    "partially_delivered",
  );
  assert.equal(statusAfterDelivery([{ ordered: 1000, done: 1000 }]), "delivered");
});

test("assertSalesTransition โยน error เมื่อข้ามขั้น", () => {
  assert.doesNotThrow(() => assertSalesTransition("draft", "confirmed"));
  assert.doesNotThrow(() => assertSalesTransition("delivered", "invoiced"));
  assert.throws(() => assertSalesTransition("draft", "delivered"), /เปลี่ยนสถานะ/);
  assert.throws(() => assertSalesTransition("invoiced", "confirmed"), /เปลี่ยนสถานะ/);
});
