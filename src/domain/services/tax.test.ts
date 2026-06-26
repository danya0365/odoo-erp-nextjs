import { test } from "node:test";
import assert from "node:assert/strict";

import { vatSummary, monthRange } from "./tax";

test("vatSummary: ภาษีขาย > ซื้อ → ต้องชำระ (บวก)", () => {
  const s = vatSummary(7000, 2000);
  assert.equal(s.outputVat, 7000);
  assert.equal(s.inputVat, 2000);
  assert.equal(s.netPayable, 5000);
});

test("vatSummary: ภาษีซื้อ > ขาย → ยอดติดลบ (ขอคืน/ยกไป)", () => {
  assert.equal(vatSummary(1000, 2500).netPayable, -1500);
});

test("monthRange: ครอบทั้งเดือน (รวมวันสุดท้าย)", () => {
  const r = monthRange("2026-02");
  assert.equal(r.from, "2026-02-01T00:00:00.000Z");
  assert.equal(r.to, "2026-02-28T23:59:59.999Z"); // 2026 ไม่ใช่ปีอธิกสุรทิน
  assert.equal(r.periodEnd, "2026-02-28");
});

test("monthRange: เดือน 31 วัน", () => {
  assert.equal(monthRange("2026-12").to, "2026-12-31T23:59:59.999Z");
});
