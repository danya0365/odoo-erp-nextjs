import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  StockCount,
  StockCountWithLines,
  StockMove,
} from "@/src/domain/entities";
import type { IStockCountRepository } from "@/src/application/repositories/IStockCountRepository";
import type {
  StockMoveInput,
  IStockMoveRepository,
  OnHandRow,
} from "@/src/application/repositories/IStockMoveRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";

import { ApplyStockCountUseCase } from "./ApplyStockCountUseCase";

const NOW = "2026-01-01T00:00:00.000Z";

class FakeCountRepo implements IStockCountRepository {
  count: StockCountWithLines;
  constructor(count: StockCountWithLines) {
    this.count = count;
  }
  async createWithLines(): Promise<StockCount> {
    throw new Error("not used");
  }
  async findById(): Promise<StockCountWithLines | null> {
    return this.count;
  }
  async list() {
    return { items: [this.count], total: 1, page: 1, pageSize: 20 };
  }
  async updateLineCounts(_shopId: string, counts: { id: string; countedQty: number }[]) {
    for (const c of counts) {
      const l = this.count.lines.find((x) => x.id === c.id);
      if (l) l.countedQty = c.countedQty;
    }
  }
  async update(_shopId: string, _id: string, patch: { status?: StockCount["status"] }): Promise<StockCount> {
    if (patch.status) this.count.status = patch.status;
    return this.count;
  }
}

class FakeStockMoveRepo implements IStockMoveRepository {
  moves: StockMoveInput[] = [];
  onHand: Map<string, number>;
  constructor(onHand: Record<string, number>) {
    this.onHand = new Map(Object.entries(onHand));
  }
  async appendMany(m: StockMoveInput[]): Promise<StockMove[]> {
    this.moves.push(...m);
    return [];
  }
  async onHandByProduct(_shopId: string, productId: string) {
    return this.onHand.get(productId) ?? 0;
  }
  async onHandByProductAndLocation() {
    return 0;
  }
  async onHandList(): Promise<OnHandRow[]> {
    return [...this.onHand.entries()].map(([productId, onHand]) => ({ productId, onHand }));
  }
  async onHandByLocationList() {
    return [];
  }
  async listByProduct() {
    return [];
  }
  async listBySourceType() {
    return [];
  }
}

class FakeLocationRepo implements IStockLocationRepository {
  async findDefault() {
    return null;
  }
  async ensureDefault(shopId: string) {
    return { id: "loc1", shopId, name: "คลังหลัก", isDefault: true, createdAt: "", updatedAt: "" };
  }
}

function makeCount(): StockCountWithLines {
  return {
    id: "sc1", shopId: "s1", docNumber: "SC00001", status: "draft", note: null,
    createdAt: NOW, updatedAt: NOW,
    lines: [
      { id: "l1", shopId: "s1", stockCountId: "sc1", productId: "p1", systemQty: 10000, countedQty: 10000 },
      { id: "l2", shopId: "s1", stockCountId: "sc1", productId: "p2", systemQty: 5000, countedQty: 5000 },
    ],
  };
}

test("ApplyStockCount: ปรับเฉพาะรายการที่มีส่วนต่าง (variance = นับ − on-hand)", async () => {
  const counts = new FakeCountRepo(makeCount());
  const moves = new FakeStockMoveRepo({ p1: 10000, p2: 5000 });
  const locations = new FakeLocationRepo();

  // p1 นับได้ 8 (ขาด -2), p2 นับได้ 5 (ตรง → ไม่ขยับ)
  const res = await new ApplyStockCountUseCase(counts, moves, locations).execute("s1", "sc1", [
    { lineId: "l1", countedQty: 8000 },
    { lineId: "l2", countedQty: 5000 },
  ]);

  assert.equal(res.status, "applied");
  assert.equal(moves.moves.length, 1); // เฉพาะ p1
  assert.equal(moves.moves[0].productId, "p1");
  assert.equal(moves.moves[0].qtyDelta, -2000); // ขาด
  assert.equal(moves.moves[0].type, "adjust");
  assert.equal(moves.moves[0].sourceType, "stocktake");
});

test("ApplyStockCount: ส่วนเกิน → qtyDelta บวก", async () => {
  const counts = new FakeCountRepo(makeCount());
  const moves = new FakeStockMoveRepo({ p1: 10000, p2: 5000 });
  await new ApplyStockCountUseCase(counts, moves, new FakeLocationRepo()).execute("s1", "sc1", [
    { lineId: "l1", countedQty: 13000 }, // เกิน +3
    { lineId: "l2", countedQty: 5000 },
  ]);
  assert.equal(moves.moves.length, 1);
  assert.equal(moves.moves[0].qtyDelta, 3000);
});

test("ApplyStockCount: กันยืนยันซ้ำ (ต้อง draft)", async () => {
  const c = makeCount();
  c.status = "applied";
  const counts = new FakeCountRepo(c);
  await assert.rejects(
    () => new ApplyStockCountUseCase(counts, new FakeStockMoveRepo({}), new FakeLocationRepo()).execute("s1", "sc1", []),
    /ยังไม่ยืนยัน/,
  );
});
