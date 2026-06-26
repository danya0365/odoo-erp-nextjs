import { test } from "node:test";
import assert from "node:assert/strict";

import {
  JOURNEYS,
  STEP_STATUS_META,
  journeyCoverage,
  overallCoverage,
  type JourneyStep,
} from "./journeys";

const step = (status: JourneyStep["status"]): JourneyStep => ({
  title: "x",
  description: "",
  route: "/x",
  status,
});

test("journeyCoverage: นับ done/partial/missing + percent (partial นับครึ่ง)", () => {
  const c = journeyCoverage([step("done"), step("done"), step("partial"), step("missing")]);
  assert.equal(c.total, 4);
  assert.equal(c.done, 2);
  assert.equal(c.partial, 1);
  assert.equal(c.missing, 1);
  assert.equal(c.donePercent, 63); // (2 + 0.5) / 4 = 62.5 → 63
});

test("journeyCoverage: รายการว่าง → 0 ทุกค่า (ไม่หารด้วยศูนย์)", () => {
  assert.deepEqual(journeyCoverage([]), {
    total: 0,
    done: 0,
    partial: 0,
    missing: 0,
    donePercent: 0,
  });
});

test("overallCoverage: รวมทุก step ข้าม journey", () => {
  const o = overallCoverage(JOURNEYS);
  assert.equal(o.journeys, JOURNEYS.length);
  assert.equal(o.totalSteps, JOURNEYS.flatMap((j) => j.steps).length);
  assert.ok(o.donePercent >= 0 && o.donePercent <= 100);
});

test("invariant: ทุก step มี route + status ที่ถูก enum", () => {
  for (const j of JOURNEYS) {
    for (const s of j.steps) {
      assert.ok(s.route.startsWith("/"), `step '${s.title}' ต้องมี route ขึ้นต้นด้วย /`);
      assert.ok(s.status in STEP_STATUS_META, `step '${s.title}' status ไม่ถูก enum`);
    }
  }
});

test("invariant: journey id ไม่ซ้ำ + มีอย่างน้อย 1 step", () => {
  const ids = JOURNEYS.map((j) => j.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const j of JOURNEYS) assert.ok(j.steps.length > 0, `journey '${j.id}' ต้องมี step`);
});

test("ครอบคลุม ≥11 journeys (ไม่น้อยหน้าโปรเจคอ้างอิง)", () => {
  assert.ok(JOURNEYS.length >= 11, `มี ${JOURNEYS.length} journeys — ต้อง ≥11`);
});
