import { test } from "node:test";
import assert from "node:assert/strict";

import {
  canTransition,
  assertTransition,
  type TransitionGraph,
} from "./document-status";

type S = "draft" | "confirmed" | "cancelled";
const graph: TransitionGraph<S> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  cancelled: [],
};

test("canTransition ตามกราฟ", () => {
  assert.equal(canTransition(graph, "draft", "confirmed"), true);
  assert.equal(canTransition(graph, "confirmed", "draft"), false);
  assert.equal(canTransition(graph, "cancelled", "confirmed"), false);
});

test("assertTransition โยน error เมื่อผิด", () => {
  assert.doesNotThrow(() => assertTransition(graph, "draft", "cancelled"));
  assert.throws(() => assertTransition(graph, "cancelled", "draft"), /เปลี่ยนสถานะไม่ได้/);
});
