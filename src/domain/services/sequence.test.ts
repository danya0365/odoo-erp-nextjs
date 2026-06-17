import { test } from "node:test";
import assert from "node:assert/strict";

import { formatDocNumber } from "./sequence";

test("formatDocNumber เติม 0 ตาม padding", () => {
  assert.equal(formatDocNumber("SO", 1, 5), "SO00001");
  assert.equal(formatDocNumber("INV", 123, 5), "INV00123");
  assert.equal(formatDocNumber("PO", 100000, 5), "PO100000"); // เกิน padding ไม่ตัด
});
