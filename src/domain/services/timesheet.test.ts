import { test } from "node:test";
import assert from "node:assert/strict";

import { parseHours, formatHours, sumMinutes } from "./timesheet";

test("parseHours: ชั่วโมง → นาที", () => {
  assert.equal(parseHours("1.5"), 90);
  assert.equal(parseHours("0.25"), 15);
  assert.equal(parseHours("8"), 480);
});

test("parseHours: รูปแบบผิด/ศูนย์ → error", () => {
  assert.throws(() => parseHours("abc"), /ไม่ถูกต้อง/);
  assert.throws(() => parseHours("0"), /มากกว่า 0/);
});

test("formatHours: นาที → ชั่วโมง 2 ตำแหน่ง", () => {
  assert.equal(formatHours(90), "1.50");
  assert.equal(formatHours(15), "0.25");
  assert.equal(formatHours(480), "8.00");
});

test("sumMinutes", () => {
  assert.equal(sumMinutes([{ minutes: 90 }, { minutes: 30 }, { minutes: 60 }]), 180);
});
