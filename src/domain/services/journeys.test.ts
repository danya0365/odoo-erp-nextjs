import { test } from "node:test";
import assert from "node:assert/strict";

import {
  JOURNEYS,
  STEP_STATUS_META,
  journeyCoverage,
  overallCoverage,
  supportedJourneys,
  realWorldJourneys,
  gapBacklog,
  gapSummary,
  type Journey,
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

test("invariant: status ถูก enum + ถ้ามี route ต้องขึ้นต้น /", () => {
  for (const j of JOURNEYS) {
    for (const s of j.steps) {
      assert.ok(s.status in STEP_STATUS_META, `step '${s.title}' status ไม่ถูก enum`);
      if (s.route !== undefined) {
        assert.ok(s.route.startsWith("/"), `step '${s.title}' route ต้องขึ้นต้นด้วย /`);
      }
    }
  }
});

test("invariant: done ต้องมี route, missing ไม่ควรมี route", () => {
  for (const j of JOURNEYS) {
    for (const s of j.steps) {
      if (s.status === "done") assert.ok(s.route, `done step '${s.title}' ต้องมี route`);
      if (s.status === "missing") assert.ok(!s.route, `missing step '${s.title}' ไม่ควรมี route`);
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

test("kind: แยก supported / real-world ถูก + รวมเท่ากับทั้งหมด", () => {
  const s = supportedJourneys();
  const r = realWorldJourneys();
  assert.ok(s.length >= 12, `supported ควร ≥12 (ได้ ${s.length})`);
  assert.ok(r.length >= 12, `real-world ควร ≥12 (ได้ ${r.length})`);
  assert.equal(s.length + r.length, JOURNEYS.length);
});

test("gapBacklog: รวม step ที่ยังไม่ done, dedup ตามชื่อ, missing มาก่อน partial", () => {
  const a: Journey = {
    id: "a", title: "A", description: "", icon: "x", estimatedTime: "—", kind: "real-world",
    steps: [
      { title: "ทำได้", description: "", route: "/x", status: "done" },
      { title: "ออกใบลดหนี้", description: "", status: "missing" },
      { title: "คืนเงิน", description: "", status: "partial" },
    ],
  };
  const b: Journey = {
    id: "b", title: "B", description: "", icon: "x", estimatedTime: "—", kind: "real-world",
    steps: [{ title: "ออกใบลดหนี้", description: "", status: "missing" }], // ซ้ำ → dedup + รวม journey
  };
  const backlog = gapBacklog([a, b]);
  assert.equal(backlog.length, 2); // ทำได้ ไม่นับ; ออกใบลดหนี้ dedup เป็น 1
  assert.equal(backlog[0].status, "missing"); // missing มาก่อน
  const credit = backlog.find((g) => g.feature === "ออกใบลดหนี้")!;
  assert.deepEqual(credit.inJourneys.sort(), ["A", "B"]);

  const sum = gapSummary([a, b]);
  assert.equal(sum.missing, 1);
  assert.equal(sum.partial, 1);
  assert.equal(sum.total, 2);
});

test("ข้อมูลจริง: มี gap (ฟีเจอร์ที่ขาด) จาก real-world journeys", () => {
  const sum = gapSummary(JOURNEYS);
  assert.ok(sum.missing > 0, "ควรมีฟีเจอร์ที่ยังไม่มี");
  assert.ok(sum.total >= sum.missing);
});
