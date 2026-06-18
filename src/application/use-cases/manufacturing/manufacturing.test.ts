import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  Bom,
  BomWithLines,
  ManufacturingOrder,
  Product,
  StockLocation,
} from "@/src/domain/entities";
import type {
  CreateBomInput,
  IBomRepository,
} from "@/src/application/repositories/IBomRepository";
import type {
  CreateManufacturingOrderInput,
  IManufacturingOrderRepository,
  ManufacturingOrderPatch,
} from "@/src/application/repositories/IManufacturingOrderRepository";
import type { IProductRepository } from "@/src/application/repositories/IProductRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";
import type {
  IStockMoveRepository,
  StockMoveInput,
} from "@/src/application/repositories/IStockMoveRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { CreateBomUseCase } from "./CreateBomUseCase";
import { CreateManufacturingOrderUseCase } from "./CreateManufacturingOrderUseCase";
import { ConfirmManufacturingOrderUseCase } from "./ConfirmManufacturingOrderUseCase";
import { ProduceManufacturingOrderUseCase } from "./ProduceManufacturingOrderUseCase";

const SHOP = "s1";
let counter = 0;
const uid = () => `id_${++counter}`;

function product(id: string): Product {
  return {
    id, shopId: SHOP, sku: id, name: id, type: "stockable", salePrice: 0, costPrice: 0,
    taxRateBp: 0, uom: "ชิ้น", isActive: true, createdAt: "t", updatedAt: "t",
  };
}

class FakeProducts implements Partial<IProductRepository> {
  constructor(private readonly ids: string[]) {}
  async findById(_s: string, id: string) {
    return this.ids.includes(id) ? product(id) : null;
  }
}

class FakeBoms implements IBomRepository {
  store: BomWithLines[] = [];
  async createWithLines(input: CreateBomInput): Promise<Bom> {
    const bom: BomWithLines = {
      id: uid(), shopId: input.shopId, productId: input.productId, name: input.name,
      isActive: true, createdAt: "t", updatedAt: "t",
      lines: input.lines.map((l) => ({ id: uid(), shopId: input.shopId, bomId: "", componentId: l.componentId, qtyPerUnit: l.qtyPerUnit })),
    };
    bom.lines.forEach((l) => (l.bomId = bom.id));
    this.store.push(bom);
    return bom;
  }
  async findById(_s: string, id: string) {
    return this.store.find((b) => b.id === id) ?? null;
  }
  async list() {
    return [...this.store];
  }
}

class FakeOrders implements IManufacturingOrderRepository {
  store: ManufacturingOrder[] = [];
  async create(input: CreateManufacturingOrderInput): Promise<ManufacturingOrder> {
    const o: ManufacturingOrder = {
      id: uid(), shopId: input.shopId, docNumber: null, bomId: input.bomId, productId: input.productId,
      qty: input.qty, status: "draft", createdAt: "t", updatedAt: "t",
    };
    this.store.push(o);
    return o;
  }
  async findById(_s: string, id: string) {
    return this.store.find((o) => o.id === id) ?? null;
  }
  async list(_s: string, q: PageQuery): Promise<Page<ManufacturingOrder>> {
    return { items: [...this.store], total: this.store.length, page: q.page, pageSize: q.pageSize };
  }
  async update(_s: string, id: string, patch: ManufacturingOrderPatch) {
    const o = this.store.find((x) => x.id === id)!;
    Object.assign(o, patch);
    return o;
  }
}

class FakeMoves implements Partial<IStockMoveRepository> {
  appended: StockMoveInput[] = [];
  constructor(private readonly onHand: Map<string, number>) {}
  async appendMany(moves: StockMoveInput[]) {
    this.appended.push(...moves);
    return [];
  }
  async onHandByProduct(_s: string, productId: string) {
    return this.onHand.get(productId) ?? 0;
  }
}

class FakeLocations implements Partial<IStockLocationRepository> {
  async ensureDefault(shopId: string): Promise<StockLocation> {
    return { id: "loc1", shopId, name: "คลังหลัก", isDefault: true, createdAt: "t", updatedAt: "t" };
  }
}

class FakeSeq implements ISequenceRepository {
  private n = new Map<string, number>();
  async next(shopId: string, key: string) {
    const k = `${shopId}:${key}`;
    const v = (this.n.get(k) ?? 0) + 1;
    this.n.set(k, v);
    return v;
  }
}

test("CreateBom: วัตถุดิบเป็นตัวเอง → error", async () => {
  const boms = new FakeBoms();
  const products = new FakeProducts(["fg", "c1"]);
  await assert.rejects(
    () => new CreateBomUseCase(boms, products as IProductRepository).execute({
      shopId: SHOP, productId: "fg", name: "สูตร",
      lines: [{ componentId: "fg", qtyPerUnit: 1000 }],
    }),
    /ไม่ใช่สินค้าสำเร็จรูปตัวเอง/,
  );
});

async function setupBomOrder(onHand: Map<string, number>) {
  const boms = new FakeBoms();
  const products = new FakeProducts(["fg", "c1", "c2"]);
  const orders = new FakeOrders();
  const bom = await new CreateBomUseCase(boms, products as IProductRepository).execute({
    shopId: SHOP, productId: "fg", name: "สูตร",
    lines: [
      { componentId: "c1", qtyPerUnit: 2000 }, // 2 ต่อชิ้น
      { componentId: "c2", qtyPerUnit: 1000 }, // 1 ต่อชิ้น
    ],
  });
  const order = await new CreateManufacturingOrderUseCase(boms, orders).execute(SHOP, bom.id, 5000); // ผลิต 5
  const moves = new FakeMoves(onHand);
  return { boms, orders, order, moves };
}

test("Confirm แล้ว Produce: ตัดวัตถุดิบ (×จำนวน) + รับสินค้าสำเร็จรูป", async () => {
  const { boms, orders, order, moves } = await setupBomOrder(new Map([["c1", 20000], ["c2", 20000]]));
  const confirmed = await new ConfirmManufacturingOrderUseCase(orders, new FakeSeq()).execute(SHOP, order.id);
  assert.equal(confirmed.docNumber, "MO00001");
  assert.equal(confirmed.status, "confirmed");

  const done = await new ProduceManufacturingOrderUseCase(
    orders, boms, moves as IStockMoveRepository, new FakeLocations() as IStockLocationRepository,
  ).execute(SHOP, order.id);
  assert.equal(done.status, "done");

  // ตัด c1 -10 (2×5), c2 -5 (1×5), รับ fg +5
  assert.equal(moves.appended.length, 3);
  assert.equal(moves.appended.find((m) => m.productId === "c1")!.qtyDelta, -10000);
  assert.equal(moves.appended.find((m) => m.productId === "c2")!.qtyDelta, -5000);
  const fg = moves.appended.find((m) => m.productId === "fg")!;
  assert.equal(fg.qtyDelta, 5000);
  assert.equal(fg.type, "in");
});

test("Produce: วัตถุดิบไม่พอ → error (ไม่เขียน move)", async () => {
  const { boms, orders, order, moves } = await setupBomOrder(new Map([["c1", 5000], ["c2", 20000]])); // c1 พอแค่ 5 ต้องใช้ 10
  await new ConfirmManufacturingOrderUseCase(orders, new FakeSeq()).execute(SHOP, order.id);
  await assert.rejects(
    () => new ProduceManufacturingOrderUseCase(
      orders, boms, moves as IStockMoveRepository, new FakeLocations() as IStockLocationRepository,
    ).execute(SHOP, order.id),
    /วัตถุดิบไม่พอ/,
  );
  assert.equal(moves.appended.length, 0);
});

test("Produce: ใบ draft (ยังไม่ยืนยัน) → error", async () => {
  const { boms, orders, order, moves } = await setupBomOrder(new Map([["c1", 20000], ["c2", 20000]]));
  await assert.rejects(
    () => new ProduceManufacturingOrderUseCase(
      orders, boms, moves as IStockMoveRepository, new FakeLocations() as IStockLocationRepository,
    ).execute(SHOP, order.id),
    /ยืนยันแล้ว/,
  );
});
