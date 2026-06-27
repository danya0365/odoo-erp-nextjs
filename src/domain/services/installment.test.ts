import { test } from "node:test";
import assert from "node:assert/strict";

import { buildSchedule, isPlanComplete, outstandingOf } from "./installment";

test("buildSchedule: แบ่งเท่ากัน งวดสุดท้ายรับเศษ + รวมเท่าเดิม", () => {
  const lines = buildSchedule(1000, 3, 30, "2026-01-01T00:00:00.000Z");
  assert.equal(lines.length, 3);
  assert.equal(lines[0].amount, 333);
  assert.equal(lines[1].amount, 333);
  assert.equal(lines[2].amount, 334); // เศษ
  assert.equal(lines.reduce((s, l) => s + l.amount, 0), 1000);
});

test("buildSchedule: วันครบกำหนดห่างกันตาม intervalDays (งวดแรกวันนี้)", () => {
  const lines = buildSchedule(900, 3, 30, "2026-01-01T00:00:00.000Z");
  assert.equal(lines[0].dueDate.slice(0, 10), "2026-01-01");
  assert.equal(lines[1].dueDate.slice(0, 10), "2026-01-31");
  assert.equal(lines[2].dueDate.slice(0, 10), "2026-03-02"); // +60 วัน
});

test("buildSchedule: input ไม่ถูกต้อง → error", () => {
  assert.throws(() => buildSchedule(1000, 0, 30, "2026-01-01"), /อย่างน้อย 1/);
  assert.throws(() => buildSchedule(0, 3, 30, "2026-01-01"), /มากกว่า 0/);
});

test("isPlanComplete + outstandingOf", () => {
  assert.equal(isPlanComplete([{ status: "paid" }, { status: "paid" }]), true);
  assert.equal(isPlanComplete([{ status: "paid" }, { status: "pending" }]), false);
  assert.equal(isPlanComplete([]), false);
  assert.equal(outstandingOf([{ amount: 500, paidAmount: 500 }, { amount: 500, paidAmount: 0 }]), 500);
});
