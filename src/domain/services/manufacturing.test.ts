import { test } from "node:test";
import assert from "node:assert/strict";

import {
  componentRequirement,
  bomUnitCost,
  hasComponentsAvailable,
} from "./manufacturing";
import {
  canConfirm,
  canProduce,
  canCancel,
  assertManufacturingTransition,
} from "./manufacturing-order-status";

test("componentRequirement = ใช้ต่อหน่วย × จำนวนผลิต (สเกล QTY_SCALE)", () => {
  // ใช้ 2 หน่วย/ชิ้น (2000) ผลิต 5 ชิ้น (5000) → 10 หน่วย (10000)
  assert.equal(componentRequirement(2000, 5000), 10000);
  // 0.5 หน่วย/ชิ้น (500) ผลิต 3 ชิ้น (3000) → 1.5 (1500)
  assert.equal(componentRequirement(500, 3000), 1500);
});

test("bomUnitCost = Σ ใช้ต่อหน่วย × ต้นทุน", () => {
  // 2 หน่วย × 50.00 + 1 หน่วย × 30.00 = 100 + 30 = 130.00
  const cost = bomUnitCost([
    { qtyPerUnit: 2000, unitCost: 5000 },
    { qtyPerUnit: 1000, unitCost: 3000 },
  ]);
  assert.equal(cost, 13000);
});

test("hasComponentsAvailable: ต้องพอทุกตัว", () => {
  assert.equal(hasComponentsAvailable([{ required: 10000, onHand: 10000 }]), true);
  assert.equal(hasComponentsAvailable([
    { required: 10000, onHand: 10000 },
    { required: 5000, onHand: 4000 },
  ]), false);
});

test("status machine: confirm/produce/cancel", () => {
  assert.equal(canConfirm("draft"), true);
  assert.equal(canConfirm("confirmed"), false);
  assert.equal(canProduce("confirmed"), true);
  assert.equal(canProduce("draft"), false);
  assert.equal(canCancel("draft"), true);
  assert.equal(canCancel("confirmed"), true);
  assert.equal(canCancel("done"), false);
});

test("assertManufacturingTransition: ห้าม done → confirmed", () => {
  assert.throws(() => assertManufacturingTransition("done", "confirmed"), /เปลี่ยนสถานะ/);
  assert.doesNotThrow(() => assertManufacturingTransition("confirmed", "done"));
});
