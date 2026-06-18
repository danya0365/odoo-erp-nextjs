import { test } from "node:test";
import assert from "node:assert/strict";

import {
  canMarkWon,
  canMarkLost,
  canReopen,
  weightedValue,
  clampProbability,
  pipelineTotals,
} from "./crm-status";

test("transition: active → won/lost ได้, won/lost → won/lost ไม่ได้", () => {
  assert.equal(canMarkWon("active"), true);
  assert.equal(canMarkLost("active"), true);
  assert.equal(canMarkWon("won"), false);
  assert.equal(canMarkLost("lost"), false);
});

test("reopen: ได้เฉพาะที่ไม่ active", () => {
  assert.equal(canReopen("won"), true);
  assert.equal(canReopen("lost"), true);
  assert.equal(canReopen("active"), false);
});

test("weightedValue = รายได้ × ความน่าจะเป็น (ปัดครึ่งขึ้น)", () => {
  assert.equal(weightedValue(100000, 50), 50000);
  assert.equal(weightedValue(10000, 25), 2500);
  assert.equal(weightedValue(333, 50), 167); // 166.5 → 167
});

test("clampProbability: บีบช่วง 0–100 + ปัดเป็นจำนวนเต็ม", () => {
  assert.equal(clampProbability(150), 100);
  assert.equal(clampProbability(-5), 0);
  assert.equal(clampProbability(33.6), 34);
  assert.equal(clampProbability(NaN), 0);
});

test("pipelineTotals: นับเฉพาะ active", () => {
  const t = pipelineTotals([
    { expectedRevenue: 100000, probability: 50, status: "active" }, // weighted 50000
    { expectedRevenue: 40000, probability: 25, status: "active" }, // weighted 10000
    { expectedRevenue: 999999, probability: 100, status: "won" }, // ไม่นับ
    { expectedRevenue: 50000, probability: 80, status: "lost" }, // ไม่นับ
  ]);
  assert.equal(t.count, 2);
  assert.equal(t.expected, 140000);
  assert.equal(t.weighted, 60000);
});
