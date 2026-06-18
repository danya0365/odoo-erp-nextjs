import { test } from "node:test";
import assert from "node:assert/strict";

import type { Product, StockLocation, StockMove } from "@/src/domain/entities";
import type {
  CreateProductInput,
  UpdateProductInput,
  IProductRepository,
} from "@/src/application/repositories/IProductRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";
import type {
  StockMoveInput,
  OnHandRow,
  IStockMoveRepository,
} from "@/src/application/repositories/IStockMoveRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import type { ReorderRule } from "@/src/domain/entities";
import type { IReorderRuleRepository } from "@/src/application/repositories/IReorderRuleRepository";
import { CreateProductUseCase } from "./CreateProductUseCase";
import { UpdateProductUseCase } from "./UpdateProductUseCase";
import { AdjustStockUseCase } from "./AdjustStockUseCase";
import { TransferStockUseCase } from "./TransferStockUseCase";
import { SetReorderRuleUseCase } from "./SetReorderRuleUseCase";
import { GetReplenishmentUseCase } from "./GetReplenishmentUseCase";

class FakeProductRepo implements IProductRepository {
  rows: Product[] = [];
  private seq = 0;
  async create(input: CreateProductInput): Promise<Product> {
    const now = "2026-01-01T00:00:00.000Z";
    const p: Product = {
      id: `prod${++this.seq}`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    this.rows.push(p);
    return p;
  }
  async findById(shopId: string, id: string) {
    return this.rows.find((r) => r.shopId === shopId && r.id === id) ?? null;
  }
  async findBySku(shopId: string, sku: string) {
    return this.rows.find((r) => r.shopId === shopId && r.sku === sku) ?? null;
  }
  async list(shopId: string, q: PageQuery): Promise<Page<Product>> {
    const items = this.rows.filter((r) => r.shopId === shopId);
    return { items, total: items.length, page: q.page, pageSize: q.pageSize };
  }
  async update(shopId: string, id: string, input: UpdateProductInput) {
    const p = (await this.findById(shopId, id))!;
    Object.assign(p, input);
    return p;
  }
  async setActive(shopId: string, id: string, isActive: boolean) {
    const p = (await this.findById(shopId, id))!;
    p.isActive = isActive;
    return p;
  }
}

class FakeLocationRepo implements IStockLocationRepository {
  loc: StockLocation | null = null;
  async findDefault() {
    return this.loc;
  }
  async ensureDefault(shopId: string) {
    if (!this.loc) {
      this.loc = {
        id: "loc1",
        shopId,
        name: "คลังหลัก",
        isDefault: true,
        createdAt: "",
        updatedAt: "",
      };
    }
    return this.loc;
  }
  async list() {
    return this.loc ? [this.loc] : [];
  }
  async findById(_shopId: string, id: string) {
    return this.loc && this.loc.id === id ? this.loc : null;
  }
  async create(shopId: string, name: string): Promise<StockLocation> {
    return { id: "loc_x", shopId, name, isDefault: false, createdAt: "", updatedAt: "" };
  }
}

class FakeStockMoveRepo implements IStockMoveRepository {
  moves: StockMove[] = [];
  private seq = 0;
  async appendMany(inputs: StockMoveInput[]): Promise<StockMove[]> {
    const created = inputs.map((m) => ({
      id: `mv${++this.seq}`,
      createdAt: "2026-01-01T00:00:00.000Z",
      sourceId: m.sourceId ?? null,
      note: m.note ?? null,
      ...m,
    }));
    this.moves.push(...created);
    return created;
  }
  async onHandByProduct(shopId: string, productId: string) {
    return this.moves
      .filter((m) => m.shopId === shopId && m.productId === productId)
      .reduce((s, m) => s + m.qtyDelta, 0);
  }
  async onHandByProductAndLocation(shopId: string, productId: string, locationId: string) {
    return this.moves
      .filter(
        (m) => m.shopId === shopId && m.productId === productId && m.locationId === locationId,
      )
      .reduce((s, m) => s + m.qtyDelta, 0);
  }
  async onHandList(): Promise<OnHandRow[]> {
    return [];
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

function stockableProduct(repo: FakeProductRepo) {
  return repo.create({
    shopId: "s1",
    sku: "SKU1",
    name: "สินค้า",
    type: "stockable",
    salePrice: 10000,
    costPrice: 8000,
    taxRateBp: 700,
    uom: "ชิ้น",
  });
}

test("CreateProductUseCase: SKU ซ้ำ → error", async () => {
  const repo = new FakeProductRepo();
  const uc = new CreateProductUseCase(repo);
  await uc.execute({
    shopId: "s1",
    sku: "A",
    name: "x",
    type: "stockable",
    salePrice: 0,
    costPrice: 0,
    taxRateBp: 0,
    uom: "ชิ้น",
  });
  await assert.rejects(
    () =>
      uc.execute({
        shopId: "s1",
        sku: "A",
        name: "y",
        type: "stockable",
        salePrice: 0,
        costPrice: 0,
        taxRateBp: 0,
        uom: "ชิ้น",
      }),
    /ถูกใช้แล้ว/,
  );
});

test("UpdateProductUseCase: เปลี่ยนเป็น SKU ที่ตัวอื่นใช้ → error", async () => {
  const repo = new FakeProductRepo();
  const a = await stockableProduct(repo);
  const b = await repo.create({
    shopId: "s1",
    sku: "SKU2",
    name: "b",
    type: "stockable",
    salePrice: 0,
    costPrice: 0,
    taxRateBp: 0,
    uom: "ชิ้น",
  });
  const uc = new UpdateProductUseCase(repo);
  await assert.rejects(() => uc.execute("s1", b.id, { sku: a.sku }), /ถูกใช้แล้ว/);
  // เปลี่ยนชื่อตัวเองได้
  const updated = await uc.execute("s1", a.id, { name: "ใหม่" });
  assert.equal(updated.name, "ใหม่");
});

test("AdjustStockUseCase: เพิ่ม/ลด on-hand + กันติดลบ + กัน non-stockable", async () => {
  const products = new FakeProductRepo();
  const moves = new FakeStockMoveRepo();
  const locations = new FakeLocationRepo();
  const p = await stockableProduct(products);
  const uc = new AdjustStockUseCase(products, moves, locations);

  // +10 (scale 1000)
  assert.equal(await uc.execute({ shopId: "s1", productId: p.id, qtyDelta: 10000 }), 10000);
  // -3 → 7
  assert.equal(await uc.execute({ shopId: "s1", productId: p.id, qtyDelta: -3000 }), 7000);
  // -8 → ติดลบ → error
  await assert.rejects(
    () => uc.execute({ shopId: "s1", productId: p.id, qtyDelta: -8000 }),
    /ติดลบ/,
  );
  // append move จริง 2 รายการ
  assert.equal(moves.moves.length, 2);

  // service type ปรับไม่ได้
  const svc = await products.create({
    shopId: "s1",
    sku: "SVC",
    name: "บริการ",
    type: "service",
    salePrice: 0,
    costPrice: 0,
    taxRateBp: 0,
    uom: "ครั้ง",
  });
  await assert.rejects(
    () => uc.execute({ shopId: "s1", productId: svc.id, qtyDelta: 1000 }),
    /นับสต๊อก/,
  );
});

// ── Inventory ขั้นสูง: โอนย้าย + จุดสั่งซื้อซ้ำ ──
class MultiLocationRepo implements IStockLocationRepository {
  constructor(private readonly store: StockLocation[]) {}
  async findDefault() { return this.store[0] ?? null; }
  async ensureDefault() { return this.store[0]; }
  async list() { return [...this.store]; }
  async findById(_s: string, id: string) { return this.store.find((l) => l.id === id) ?? null; }
  async create(shopId: string, name: string): Promise<StockLocation> {
    const l: StockLocation = { id: `loc_${this.store.length + 1}`, shopId, name, isDefault: false, createdAt: "", updatedAt: "" };
    this.store.push(l);
    return l;
  }
}

function makeLoc(id: string, name: string): StockLocation {
  return { id, shopId: "s1", name, isDefault: false, createdAt: "", updatedAt: "" };
}

test("TransferStock: เขียน 2 move คู่ (out ต้นทาง −, in ปลายทาง +)", async () => {
  const locations = new MultiLocationRepo([makeLoc("L1", "A"), makeLoc("L2", "B")]);
  const moves = new FakeStockMoveRepo();
  await moves.appendMany([
    { shopId: "s1", productId: "p1", locationId: "L1", qtyDelta: 10000, type: "in", sourceType: "adjustment" },
  ]);
  await new TransferStockUseCase(locations, moves).execute({
    shopId: "s1", productId: "p1", fromLocationId: "L1", toLocationId: "L2", qty: 4000,
  });
  assert.equal(await moves.onHandByProductAndLocation("s1", "p1", "L1"), 6000);
  assert.equal(await moves.onHandByProductAndLocation("s1", "p1", "L2"), 4000);
  assert.equal(await moves.onHandByProduct("s1", "p1"), 10000); // รวมไม่เปลี่ยน
});

test("TransferStock: โอนเกินยอดต้นทาง → error (ไม่เขียน move)", async () => {
  const locations = new MultiLocationRepo([makeLoc("L1", "A"), makeLoc("L2", "B")]);
  const moves = new FakeStockMoveRepo();
  await moves.appendMany([
    { shopId: "s1", productId: "p1", locationId: "L1", qtyDelta: 3000, type: "in", sourceType: "adjustment" },
  ]);
  await assert.rejects(
    () => new TransferStockUseCase(locations, moves).execute({
      shopId: "s1", productId: "p1", fromLocationId: "L1", toLocationId: "L2", qty: 4000,
    }),
    /เกินยอดคงเหลือ/,
  );
  assert.equal(moves.moves.length, 1); // มีแค่ตัวตั้งต้น
});

test("TransferStock: คลังต้นทาง=ปลายทาง → error", async () => {
  const locations = new MultiLocationRepo([makeLoc("L1", "A")]);
  const moves = new FakeStockMoveRepo();
  await assert.rejects(
    () => new TransferStockUseCase(locations, moves).execute({
      shopId: "s1", productId: "p1", fromLocationId: "L1", toLocationId: "L1", qty: 1000,
    }),
    /ต้องต่างกัน/,
  );
});

class FakeReorderRepo implements IReorderRuleRepository {
  store: ReorderRule[] = [];
  async upsert(shopId: string, productId: string, minQty: number, maxQty: number): Promise<ReorderRule> {
    const ex = this.store.find((r) => r.productId === productId);
    if (ex) { ex.minQty = minQty; ex.maxQty = maxQty; return ex; }
    const r: ReorderRule = { id: `rr${this.store.length + 1}`, shopId, productId, minQty, maxQty, createdAt: "", updatedAt: "" };
    this.store.push(r);
    return r;
  }
  async list() { return [...this.store]; }
  async findByProduct(_s: string, productId: string) { return this.store.find((r) => r.productId === productId) ?? null; }
}

test("SetReorderRule: max < min → error", async () => {
  const products = new FakeProductRepo();
  const p = await stockableProduct(products);
  await assert.rejects(
    () => new SetReorderRuleUseCase(new FakeReorderRepo(), products).execute("s1", p.id, 5000, 2000),
    /ไม่น้อยกว่าขั้นต่ำ/,
  );
});

test("GetReplenishment: suggestion + นับที่ต้องเติม + กรอง stockable", async () => {
  const products = new FakeProductRepo();
  const low = await products.create({ shopId: "s1", sku: "LOW", name: "ต่ำ", type: "stockable", salePrice: 0, costPrice: 0, taxRateBp: 0, uom: "ชิ้น" });
  const ok = await products.create({ shopId: "s1", sku: "OK", name: "พอ", type: "stockable", salePrice: 0, costPrice: 0, taxRateBp: 0, uom: "ชิ้น" });
  await products.create({ shopId: "s1", sku: "SVC", name: "บริการ", type: "service", salePrice: 0, costPrice: 0, taxRateBp: 0, uom: "ครั้ง" });

  const rules = new FakeReorderRepo();
  await rules.upsert("s1", low.id, 5000, 20000);
  await rules.upsert("s1", ok.id, 1000, 10000);

  const moves = new FakeStockMoveRepo();
  await moves.appendMany([
    { shopId: "s1", productId: low.id, locationId: "L1", qtyDelta: 2000, type: "in", sourceType: "adjustment" },
    { shopId: "s1", productId: ok.id, locationId: "L1", qtyDelta: 8000, type: "in", sourceType: "adjustment" },
  ]);
  // ปรับ onHandList ให้คืนค่าจริงสำหรับเทสนี้
  moves.onHandList = async () => [
    { productId: low.id, onHand: 2000 },
    { productId: ok.id, onHand: 8000 },
  ];

  const res = await new GetReplenishmentUseCase(rules, moves, products).execute("s1");
  assert.equal(res.rows.length, 2); // service ถูกกรอง
  assert.equal(res.rows.find((r) => r.productId === low.id)!.suggestion, 18000);
  assert.equal(res.rows.find((r) => r.productId === ok.id)!.suggestion, 0);
  assert.equal(res.toReorder, 1);
});
