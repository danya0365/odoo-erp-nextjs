import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  Account,
  Journal,
  PosSession,
  StockLocation,
} from "@/src/domain/entities";
import { DEFAULT_ACCOUNTS, DEFAULT_JOURNALS } from "@/src/domain/services/accounting";
import type { IAccountRepository } from "@/src/application/repositories/IAccountRepository";
import type { IJournalRepository } from "@/src/application/repositories/IJournalRepository";
import type {
  CreateJournalEntryInput,
  IJournalEntryRepository,
} from "@/src/application/repositories/IJournalEntryRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";
import type {
  CloseSessionPatch,
  IPosSessionRepository,
  OpenSessionInput,
} from "@/src/application/repositories/IPosSessionRepository";
import type {
  CreatePosOrderInput,
  IPosOrderRepository,
} from "@/src/application/repositories/IPosOrderRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";
import type {
  IStockMoveRepository,
  StockMoveInput,
} from "@/src/application/repositories/IStockMoveRepository";
import { OpenPosSessionUseCase } from "./OpenPosSessionUseCase";
import { CheckoutPosOrderUseCase } from "./CheckoutPosOrderUseCase";
import { ClosePosSessionUseCase } from "./ClosePosSessionUseCase";

const SHOP = "s1";
let counter = 0;
const uid = () => `id_${++counter}`;

class FakeSessions implements IPosSessionRepository {
  store: PosSession[] = [];
  async open(input: OpenSessionInput): Promise<PosSession> {
    const s: PosSession = {
      id: uid(), shopId: input.shopId, userId: input.userId, status: "open",
      openingCash: input.openingCash, closingCash: null, expectedCash: null, difference: null,
      openedAt: input.openedAt, closedAt: null,
    };
    this.store.push(s);
    return s;
  }
  async findById(shopId: string, id: string) {
    return this.store.find((s) => s.shopId === shopId && s.id === id) ?? null;
  }
  async findOpen(shopId: string) {
    return this.store.find((s) => s.shopId === shopId && s.status === "open") ?? null;
  }
  async list(shopId: string) {
    return this.store.filter((s) => s.shopId === shopId);
  }
  async close(shopId: string, id: string, patch: CloseSessionPatch): Promise<PosSession> {
    const s = (await this.findById(shopId, id))!;
    Object.assign(s, { status: "closed", ...patch });
    return s;
  }
}

class FakePosOrders implements IPosOrderRepository {
  created: (CreatePosOrderInput & { id: string })[] = [];
  async createWithLines(input: CreatePosOrderInput) {
    const order = { ...input, id: uid() };
    this.created.push(order);
    return {
      id: order.id, shopId: input.shopId, sessionId: input.sessionId, docNumber: input.docNumber,
      untaxedAmount: input.untaxedAmount, taxAmount: input.taxAmount, totalAmount: input.totalAmount,
      paymentMethod: input.paymentMethod, createdAt: "t",
    };
  }
  async findById() { return null; }
  async listBySession() { return []; }
  async cashTotalBySession(_s: string, sessionId: string) {
    return this.created
      .filter((o) => o.sessionId === sessionId && o.paymentMethod === "cash")
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }
}

class FakeStockMoves implements Partial<IStockMoveRepository> {
  appended: StockMoveInput[] = [];
  constructor(private readonly onHand = new Map<string, number>()) {}
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

class FakeAccounts implements IAccountRepository {
  private store: Account[] = [];
  async ensureDefaults(shopId: string): Promise<Account[]> {
    if (this.store.length === 0) {
      this.store = DEFAULT_ACCOUNTS.map((a) => ({
        id: uid(), shopId, code: a.code, name: a.name, type: a.type, isActive: true, createdAt: "t", updatedAt: "t",
      }));
    }
    return [...this.store];
  }
  async list() { return [...this.store]; }
  async findByCode(_s: string, code: string) { return this.store.find((a) => a.code === code) ?? null; }
  async codeMap() { return new Map(this.store.map((a) => [a.code, a])); }
  async create(): Promise<Account> { return this.store[0]; }
}
class FakeJournals implements IJournalRepository {
  private store: Journal[] = [];
  async ensureDefaults(shopId: string): Promise<Journal[]> {
    if (this.store.length === 0) {
      this.store = DEFAULT_JOURNALS.map((j) => ({ id: uid(), shopId, code: j.code, name: j.name, type: j.type, createdAt: "t", updatedAt: "t" }));
    }
    return [...this.store];
  }
  async list() { return [...this.store]; }
  async findByType(_s: string, type: Journal["type"]) { return this.store.find((j) => j.type === type) ?? null; }
}
class FakeEntries implements Partial<IJournalEntryRepository> {
  entries: (CreateJournalEntryInput & { id: string })[] = [];
  async findBySource(shopId: string, sourceType: string, sourceId: string) {
    const e = this.entries.find((x) => x.shopId === shopId && x.sourceType === sourceType && x.sourceId === sourceId);
    return e ? ({ ...e, ref: e.ref ?? null, sourceId: e.sourceId ?? null, createdAt: "t", updatedAt: "t" } as never) : null;
  }
  async createWithLines(input: CreateJournalEntryInput) {
    const e = { ...input, id: uid() };
    this.entries.push(e);
    return { ...input, id: e.id, ref: input.ref ?? null, sourceId: input.sourceId ?? null, createdAt: "t", updatedAt: "t" };
  }
}

function postDeps() {
  return {
    accounts: new FakeAccounts(),
    journals: new FakeJournals(),
    entries: new FakeEntries() as IJournalEntryRepository,
    sequences: new FakeSeq(),
  };
}

test("OpenSession: เปิดซ้ำไม่ได้", async () => {
  const sessions = new FakeSessions();
  const uc = new OpenPosSessionUseCase(sessions);
  await uc.execute(SHOP, "u1", 100000, "t");
  await assert.rejects(() => uc.execute(SHOP, "u1", 100000, "t"), /เปิดอยู่แล้ว/);
});

test("Checkout: สร้าง order + ตัดสต๊อก OUT + ลงบัญชีขายสด (สมดุล)", async () => {
  const sessions = new FakeSessions();
  const session = await sessions.open({ shopId: SHOP, userId: "u1", openingCash: 100000, openedAt: "t" });
  const orders = new FakePosOrders();
  const moves = new FakeStockMoves(new Map([["p1", 50000]]));
  const deps = postDeps();
  const order = await new CheckoutPosOrderUseCase(
    sessions, orders, moves as IStockMoveRepository, new FakeLocations() as IStockLocationRepository, deps.sequences, deps,
  ).execute({
    shopId: SHOP, sessionId: session.id, paymentMethod: "cash", now: "t",
    lines: [{ productId: "p1", description: "สินค้า", qty: 2000, unitPrice: 10000, taxRateBp: 700, isStockable: true }],
  });
  // 2 หน่วย × 100.00 = 200.00 + 7% = 214.00
  assert.equal(order.totalAmount, 21400);
  assert.equal(order.docNumber, "POS00001");
  // ตัดสต๊อก -2 (2000)
  assert.equal(moves.appended.length, 1);
  assert.equal(moves.appended[0].qtyDelta, -2000);
  assert.equal(moves.appended[0].type, "out");
  // ลงบัญชี 1 entry สมดุล
  const entries = (deps.entries as unknown as FakeEntries).entries;
  assert.equal(entries.length, 1);
  const lines = entries[0].lines;
  const debit = lines.reduce((s, l) => s + l.debit, 0);
  const credit = lines.reduce((s, l) => s + l.credit, 0);
  assert.equal(debit, 21400);
  assert.equal(credit, 21400);
});

test("Checkout: ขายเกินสต๊อก → error", async () => {
  const sessions = new FakeSessions();
  const session = await sessions.open({ shopId: SHOP, userId: "u1", openingCash: 0, openedAt: "t" });
  const moves = new FakeStockMoves(new Map([["p1", 1000]])); // มี 1 หน่วย
  const deps = postDeps();
  await assert.rejects(
    () => new CheckoutPosOrderUseCase(
      sessions, new FakePosOrders(), moves as IStockMoveRepository, new FakeLocations() as IStockLocationRepository, deps.sequences, deps,
    ).execute({
      shopId: SHOP, sessionId: session.id, paymentMethod: "cash", now: "t",
      lines: [{ productId: "p1", description: "X", qty: 2000, unitPrice: 100, taxRateBp: 0, isStockable: true }],
    }),
    /สต๊อกไม่พอ/,
  );
});

test("Close: expected = ตั้งต้น + ขายเงินสด, difference = นับจริง − expected", async () => {
  const sessions = new FakeSessions();
  const session = await sessions.open({ shopId: SHOP, userId: "u1", openingCash: 100000, openedAt: "t" });
  const orders = new FakePosOrders();
  const moves = new FakeStockMoves(new Map([["p1", 99999000]]));
  const deps = postDeps();
  const checkout = new CheckoutPosOrderUseCase(
    sessions, orders, moves as IStockMoveRepository, new FakeLocations() as IStockLocationRepository, deps.sequences, deps,
  );
  await checkout.execute({
    shopId: SHOP, sessionId: session.id, paymentMethod: "cash", now: "t",
    lines: [{ productId: "p1", description: "X", qty: 1000, unitPrice: 50000, taxRateBp: 0, isStockable: true }],
  }); // ขายสด 500.00

  const closed = await new ClosePosSessionUseCase(sessions, orders).execute(SHOP, session.id, 160000, "t");
  assert.equal(closed.expectedCash, 150000); // 100000 + 50000
  assert.equal(closed.difference, 10000); // 160000 - 150000 (เกิน)
  assert.equal(closed.status, "closed");
});
