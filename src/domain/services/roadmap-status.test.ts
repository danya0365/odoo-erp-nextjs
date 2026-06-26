import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ROADMAP_ITEMS,
  ROADMAP_TIERS,
  roadmapSummary,
  plannedByTier,
  type RoadmapItemDef,
} from "./roadmap-status";

test("roadmapSummary: นับ done/review/planned + donePercent ถูก", () => {
  const items: RoadmapItemDef[] = [
    { key: "a", label: "A", desc: "", status: "done", href: "/a" },
    { key: "b", label: "B", desc: "", status: "done", href: "/b" },
    { key: "c", label: "C", desc: "", status: "review" },
    { key: "d", label: "D", desc: "", status: "planned", tier: "P1" },
  ];
  const s = roadmapSummary(items);
  assert.equal(s.total, 4);
  assert.equal(s.done, 2);
  assert.equal(s.review, 1);
  assert.equal(s.planned, 1);
  assert.equal(s.donePercent, 50);
});

test("roadmapSummary: รายการว่าง → 0 ทุกค่า (ไม่หารด้วยศูนย์)", () => {
  const s = roadmapSummary([]);
  assert.deepEqual(s, { total: 0, done: 0, review: 0, planned: 0, donePercent: 0 });
});

test("plannedByTier: คืนเฉพาะ planned ใน tier นั้น", () => {
  const p1 = plannedByTier(ROADMAP_ITEMS, "P1");
  assert.ok(p1.length > 0);
  assert.ok(p1.every((i) => i.status === "planned" && i.tier === "P1"));
});

test("invariant: done ทุกตัวมี href, planned ทุกตัวมี tier ที่ถูกต้อง", () => {
  for (const i of ROADMAP_ITEMS) {
    if (i.status === "done") {
      assert.ok(i.href, `done item ${i.key} ต้องมี href`);
    }
    if (i.status === "planned") {
      assert.ok(i.tier && ROADMAP_TIERS.includes(i.tier), `planned item ${i.key} ต้องมี tier ที่ถูกต้อง`);
    }
  }
});

test("invariant: key ไม่ซ้ำกัน", () => {
  const keys = ROADMAP_ITEMS.map((i) => i.key);
  assert.equal(new Set(keys).size, keys.length);
});

test("ข้อมูลจริง: มี 13 modules ที่ done (ตรงกับ feature-status.md)", () => {
  assert.equal(roadmapSummary(ROADMAP_ITEMS).done, 13);
});
