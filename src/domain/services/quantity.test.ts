import { test } from "node:test";
import assert from "node:assert/strict";

import {
  remaining,
  canProgress,
  isAllFull,
  progressState,
} from "./quantity";

test("remaining ไม่ติดลบ", () => {
  assert.equal(remaining({ ordered: 1000, done: 300 }), 700);
  assert.equal(remaining({ ordered: 1000, done: 1000 }), 0);
  assert.equal(remaining({ ordered: 1000, done: 1500 }), 0);
});

test("canProgress กันเกินและกัน <= 0", () => {
  assert.equal(canProgress({ ordered: 1000, done: 0 }, 1000), true);
  assert.equal(canProgress({ ordered: 1000, done: 600 }, 400), true);
  assert.equal(canProgress({ ordered: 1000, done: 600 }, 401), false); // เกิน
  assert.equal(canProgress({ ordered: 1000, done: 0 }, 0), false);
  assert.equal(canProgress({ ordered: 1000, done: 0 }, -5), false);
});

test("progressState: none / partial / full", () => {
  assert.equal(progressState([{ ordered: 1000, done: 0 }]), "none");
  assert.equal(
    progressState([
      { ordered: 1000, done: 500 },
      { ordered: 1000, done: 0 },
    ]),
    "partial",
  );
  assert.equal(
    progressState([
      { ordered: 1000, done: 1000 },
      { ordered: 500, done: 500 },
    ]),
    "full",
  );
  assert.equal(isAllFull([{ ordered: 1000, done: 1000 }]), true);
});
