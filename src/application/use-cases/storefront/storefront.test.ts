import { test } from "node:test";
import assert from "node:assert/strict";

import type { OnlineOrder, Partner, Product, SalesOrder, Shop } from "@/src/domain/entities";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { IProductRepository } from "@/src/application/repositories/IProductRepository";
import type {
  CreatePartnerInput,
  IPartnerRepository,
} from "@/src/application/repositories/IPartnerRepository";
import type {
  CreateSalesOrderInput,
  ISalesOrderRepository,
} from "@/src/application/repositories/ISalesOrderRepository";
import type {
  CreateOnlineOrderInput,
  IOnlineOrderRepository,
} from "@/src/application/repositories/IOnlineOrderRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";
import { PlaceOnlineOrderUseCase } from "./PlaceOnlineOrderUseCase";

let counter = 0;
const uid = () => `id_${++counter}`;
const SHOP_ID = "shop1";

function shop(active = true): Shop {
  return { id: SHOP_ID, name: "ร้าน", slug: "demo", isActive: active, createdAt: "t", updatedAt: "t" };
}
function product(id: string, price: number, tax = 0, active = true): Product {
  return {
    id, shopId: SHOP_ID, sku: id, name: `สินค้า ${id}`, type: "stockable", salePrice: price,
    costPrice: 0, taxRateBp: tax, uom: "ชิ้น", isActive: active, createdAt: "t", updatedAt: "t",
  };
}

class FakeShops implements IShopRepository {
  constructor(private readonly s: Shop | null) {}
  async create(): Promise<Shop> { return shop(); }
  async findById() { return this.s; }
  async findBySlug() { return this.s; }
}
class FakeProducts implements Partial<IProductRepository> {
  constructor(private readonly items: Product[]) {}
  async findById(_s: string, id: string) { return this.items.find((p) => p.id === id) ?? null; }
}
class FakePartners implements Partial<IPartnerRepository> {
  store: Partner[] = [];
  async findByEmail(_s: string, email: string) { return this.store.find((p) => p.email === email) ?? null; }
  async create(input: CreatePartnerInput): Promise<Partner> {
    const p: Partner = {
      id: uid(), shopId: input.shopId, name: input.name, type: input.type, email: input.email ?? null,
      phone: input.phone ?? null, taxId: null, street: null, city: null, country: null,
      isCompany: false, parentId: null, isActive: true, createdAt: "t", updatedAt: "t",
    };
    this.store.push(p);
    return p;
  }
}
class FakeSalesOrders implements Partial<ISalesOrderRepository> {
  created: CreateSalesOrderInput[] = [];
  async createWithLines(input: CreateSalesOrderInput): Promise<SalesOrder> {
    this.created.push(input);
    return {
      id: uid(), shopId: input.shopId, docNumber: null, customerId: input.customerId, status: "draft",
      currency: input.currency, untaxedAmount: input.untaxedAmount, taxAmount: input.taxAmount,
      totalAmount: input.totalAmount, orderDate: input.orderDate, confirmedAt: null, note: input.note ?? null,
      createdAt: "t", updatedAt: "t",
    };
  }
}
class FakeOnlineOrders implements IOnlineOrderRepository {
  store: OnlineOrder[] = [];
  async create(input: CreateOnlineOrderInput): Promise<OnlineOrder> {
    const o: OnlineOrder = { id: uid(), createdAt: "t", phone: input.phone ?? null, ...input };
    this.store.push(o);
    return o;
  }
  async findById(_s: string, id: string) { return this.store.find((o) => o.id === id) ?? null; }
  async list() { return [...this.store]; }
}
class FakeSeq implements ISequenceRepository {
  private n = new Map<string, number>();
  async next(s: string, k: string) {
    const key = `${s}:${k}`;
    const v = (this.n.get(key) ?? 0) + 1;
    this.n.set(key, v);
    return v;
  }
}

function deps(opts: { shop?: Shop | null; products?: Product[] } = {}) {
  const partners = new FakePartners();
  const salesOrders = new FakeSalesOrders();
  const onlineOrders = new FakeOnlineOrders();
  const uc = new PlaceOnlineOrderUseCase(
    new FakeShops(opts.shop === undefined ? shop() : opts.shop),
    new FakeProducts(opts.products ?? [product("p1", 10000, 700)]) as IProductRepository,
    partners as IPartnerRepository,
    salesOrders as ISalesOrderRepository,
    onlineOrders,
    new FakeSeq(),
  );
  return { uc, partners, salesOrders, onlineOrders };
}

test("PlaceOnlineOrder: สร้างใบขาย draft + ลูกค้าใหม่ + online order (WEB เลข)", async () => {
  const { uc, partners, salesOrders, onlineOrders } = deps();
  const order = await uc.execute({
    slug: "demo", customer: { name: "ลูกค้า", email: "a@b.com" },
    lines: [{ productId: "p1", qty: 2000 }], orderDate: "t",
  });
  assert.equal(order.orderNumber, "WEB00001");
  assert.equal(order.totalAmount, 21400); // 2 × 100 + 7%
  assert.equal(partners.store.length, 1); // ลูกค้าใหม่
  assert.equal(salesOrders.created.length, 1);
  assert.equal(salesOrders.created[0].lines.length, 1);
  assert.equal(onlineOrders.store[0].salesOrderId, order.salesOrderId);
});

test("PlaceOnlineOrder: อีเมลเดิม → ใช้ลูกค้าเดิม (ไม่สร้างซ้ำ)", async () => {
  const { uc, partners } = deps();
  await uc.execute({ slug: "demo", customer: { name: "A", email: "same@b.com" }, lines: [{ productId: "p1", qty: 1000 }], orderDate: "t" });
  await uc.execute({ slug: "demo", customer: { name: "A2", email: "same@b.com" }, lines: [{ productId: "p1", qty: 1000 }], orderDate: "t" });
  assert.equal(partners.store.length, 1);
});

test("PlaceOnlineOrder: อีเมลผิด → error", async () => {
  const { uc } = deps();
  await assert.rejects(
    () => uc.execute({ slug: "demo", customer: { name: "A", email: "bad" }, lines: [{ productId: "p1", qty: 1000 }], orderDate: "t" }),
    /อีเมล/,
  );
});

test("PlaceOnlineOrder: ตะกร้าว่าง → error", async () => {
  const { uc } = deps();
  await assert.rejects(
    () => uc.execute({ slug: "demo", customer: { name: "A", email: "a@b.com" }, lines: [], orderDate: "t" }),
    /ตะกร้าว่าง/,
  );
});

test("PlaceOnlineOrder: ร้านปิด/ไม่พบ → error", async () => {
  const { uc } = deps({ shop: null });
  await assert.rejects(
    () => uc.execute({ slug: "x", customer: { name: "A", email: "a@b.com" }, lines: [{ productId: "p1", qty: 1000 }], orderDate: "t" }),
    /ไม่พบร้าน/,
  );
});
