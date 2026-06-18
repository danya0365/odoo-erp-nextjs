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
import { CreateProductUseCase } from "./CreateProductUseCase";
import { UpdateProductUseCase } from "./UpdateProductUseCase";
import { AdjustStockUseCase } from "./AdjustStockUseCase";

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
  async onHandList(): Promise<OnHandRow[]> {
    return [];
  }
  async listByProduct() {
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
