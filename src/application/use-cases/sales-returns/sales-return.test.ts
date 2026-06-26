import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  Invoice,
  InvoiceLine,
  Payment,
  SalesReturn,
  SalesReturnLine,
  SalesReturnWithLines,
} from "@/src/domain/entities";
import type {
  CreateSalesReturnInput,
  ISalesReturnRepository,
} from "@/src/application/repositories/ISalesReturnRepository";
import type { IInvoiceRepository } from "@/src/application/repositories/IInvoiceRepository";
import type {
  CreatePaymentInput,
  IPaymentRepository,
} from "@/src/application/repositories/IPaymentRepository";
import type {
  StockMoveInput,
  IStockMoveRepository,
} from "@/src/application/repositories/IStockMoveRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";
import type { Page } from "@/src/application/repositories/pagination";

import { CreateSalesReturnUseCase } from "./CreateSalesReturnUseCase";
import { ConfirmSalesReturnUseCase } from "./ConfirmSalesReturnUseCase";
import { RefundSalesReturnUseCase } from "./RefundSalesReturnUseCase";

const NOW = "2026-01-01T00:00:00.000Z";

class FakeReturnRepo implements ISalesReturnRepository {
  returns = new Map<string, SalesReturn>();
  lines = new Map<string, SalesReturnLine[]>();
  private seq = 0;
  async createWithLines(input: CreateSalesReturnInput): Promise<SalesReturn> {
    const rid = `ret${++this.seq}`;
    const ret: SalesReturn = {
      id: rid,
      shopId: input.shopId,
      docNumber: input.docNumber,
      invoiceId: input.invoiceId,
      salesOrderId: input.salesOrderId,
      customerId: input.customerId,
      status: input.status,
      currency: input.currency,
      untaxedAmount: input.untaxedAmount,
      taxAmount: input.taxAmount,
      totalAmount: input.totalAmount,
      refundedAmount: 0,
      reason: input.reason,
      createdAt: NOW,
      updatedAt: NOW,
    };
    this.returns.set(rid, ret);
    this.lines.set(
      rid,
      input.lines.map((l, i) => ({ id: `${rid}-l${i}`, shopId: input.shopId, salesReturnId: rid, ...l })),
    );
    return ret;
  }
  async findById(shopId: string, id: string): Promise<SalesReturnWithLines | null> {
    const r = this.returns.get(id);
    if (!r || r.shopId !== shopId) return null;
    return { ...r, lines: this.lines.get(id) ?? [] };
  }
  async list(): Promise<Page<SalesReturn>> {
    return { items: [...this.returns.values()], total: this.returns.size, page: 1, pageSize: 20 };
  }
  async listByInvoice(): Promise<SalesReturn[]> {
    return [];
  }
  async update(
    shopId: string,
    id: string,
    patch: { status?: SalesReturn["status"]; refundedAmount?: number },
  ): Promise<SalesReturn> {
    const r = this.returns.get(id)!;
    Object.assign(r, patch);
    return r;
  }
}

class FakeInvoiceRepo implements IInvoiceRepository {
  inv: Invoice = {
    id: "inv1", shopId: "s1", docNumber: "INV00001", salesOrderId: "so1", customerId: "cust1",
    status: "paid", currency: "THB", untaxedAmount: 200, taxAmount: 14, totalAmount: 214,
    amountPaid: 214, dueDate: null, createdAt: NOW, updatedAt: NOW,
  };
  lines: InvoiceLine[] = [
    { id: "il1", shopId: "s1", invoiceId: "inv1", productId: "p1", description: "สินค้า",
      qty: 2000, unitPrice: 100, taxRateBp: 700, lineSubtotal: 200, lineTax: 14, lineTotal: 214 },
  ];
  async createWithLines(): Promise<Invoice> {
    return this.inv;
  }
  async findById(shopId: string, id: string): Promise<Invoice | null> {
    return id === this.inv.id && shopId === this.inv.shopId ? this.inv : null;
  }
  async listLines(): Promise<InvoiceLine[]> {
    return this.lines;
  }
  async listBySalesOrder(): Promise<Invoice[]> {
    return [];
  }
  async list(): Promise<Page<Invoice>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
  async update(): Promise<Invoice> {
    return this.inv;
  }
}

class FakeStockMoveRepo implements IStockMoveRepository {
  moves: StockMoveInput[] = [];
  async appendMany(m: StockMoveInput[]) {
    this.moves.push(...m);
    return [];
  }
  async onHandByProduct() {
    return 0;
  }
  async onHandList() {
    return [];
  }
  async listByProduct() {
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

class FakePaymentRepo implements IPaymentRepository {
  payments: Payment[] = [];
  private seq = 0;
  async create(input: CreatePaymentInput): Promise<Payment> {
    const p: Payment = {
      id: `pay${++this.seq}`, createdAt: NOW,
      invoiceId: input.invoiceId ?? null, vendorBillId: input.vendorBillId ?? null,
      shopId: input.shopId, docNumber: input.docNumber, partnerId: input.partnerId,
      direction: input.direction, amount: input.amount, method: input.method, paidAt: input.paidAt,
    };
    this.payments.push(p);
    return p;
  }
  async listByInvoice() {
    return [];
  }
  async listByVendorBill() {
    return [];
  }
}

class FakeSequenceRepo implements ISequenceRepository {
  counters = new Map<string, number>();
  async next(shopId: string, key: string) {
    const k = `${shopId}:${key}`;
    const v = (this.counters.get(k) ?? 0) + 1;
    this.counters.set(k, v);
    return v;
  }
}

function deps() {
  return {
    returns: new FakeReturnRepo(),
    invoices: new FakeInvoiceRepo(),
    moves: new FakeStockMoveRepo(),
    locations: new FakeLocationRepo(),
    payments: new FakePaymentRepo(),
    seq: new FakeSequenceRepo(),
  };
}

test("CreateSalesReturn: คิดยอดจากบรรทัดใบแจ้งหนี้ + docNumber CN + draft", async () => {
  const d = deps();
  const ret = await new CreateSalesReturnUseCase(d.returns, d.invoices, d.seq).execute(
    "s1", "inv1", [{ invoiceLineId: "il1", qty: 1000 }], "ชำรุด",
  );
  // คืน 1 ชิ้น (จาก 2): subtotal 100, tax 7, total 107
  assert.equal(ret.untaxedAmount, 100);
  assert.equal(ret.taxAmount, 7);
  assert.equal(ret.totalAmount, 107);
  assert.equal(ret.docNumber, "CN00001");
  assert.equal(ret.status, "draft");
  assert.equal(ret.invoiceId, "inv1");
});

test("CreateSalesReturn: กันคืนเกินจำนวนในใบแจ้งหนี้", async () => {
  const d = deps();
  await assert.rejects(
    () => new CreateSalesReturnUseCase(d.returns, d.invoices, d.seq).execute(
      "s1", "inv1", [{ invoiceLineId: "il1", qty: 3000 }], null,
    ),
    /เกินจำนวน/,
  );
});

test("Confirm: stock IN กลับเข้าคลัง + สถานะ credited", async () => {
  const d = deps();
  const ret = await new CreateSalesReturnUseCase(d.returns, d.invoices, d.seq).execute(
    "s1", "inv1", [{ invoiceLineId: "il1", qty: 2000 }], null,
  );
  const confirmed = await new ConfirmSalesReturnUseCase(d.returns, d.moves, d.locations).execute("s1", ret.id);
  assert.equal(confirmed.status, "credited");
  assert.equal(d.moves.moves.length, 1);
  assert.equal(d.moves.moves[0].qtyDelta, 2000); // IN (บวก)
  assert.equal(d.moves.moves[0].type, "in");
  assert.equal(d.moves.moves[0].sourceType, "sales_return");
});

test("Confirm: กันยืนยันซ้ำ (ต้องเป็น draft)", async () => {
  const d = deps();
  const ret = await new CreateSalesReturnUseCase(d.returns, d.invoices, d.seq).execute(
    "s1", "inv1", [{ invoiceLineId: "il1", qty: 1000 }], null,
  );
  const confirm = new ConfirmSalesReturnUseCase(d.returns, d.moves, d.locations);
  await confirm.execute("s1", ret.id);
  await assert.rejects(() => confirm.execute("s1", ret.id), /ร่าง/);
});

test("Refund: สร้าง payment outbound เต็มยอด + สถานะ refunded", async () => {
  const d = deps();
  const ret = await new CreateSalesReturnUseCase(d.returns, d.invoices, d.seq).execute(
    "s1", "inv1", [{ invoiceLineId: "il1", qty: 2000 }], null,
  );
  await new ConfirmSalesReturnUseCase(d.returns, d.moves, d.locations).execute("s1", ret.id);
  const refunded = await new RefundSalesReturnUseCase(d.returns, d.payments, d.seq).execute("s1", ret.id, "cash", NOW);
  assert.equal(refunded.status, "refunded");
  assert.equal(refunded.refundedAmount, 214);
  assert.equal(d.payments.payments.length, 1);
  assert.equal(d.payments.payments[0].direction, "outbound");
  assert.equal(d.payments.payments[0].amount, 214);
});

test("Refund: กันคืนเงินก่อนออกใบลดหนี้ (ต้อง credited)", async () => {
  const d = deps();
  const ret = await new CreateSalesReturnUseCase(d.returns, d.invoices, d.seq).execute(
    "s1", "inv1", [{ invoiceLineId: "il1", qty: 1000 }], null,
  );
  await assert.rejects(
    () => new RefundSalesReturnUseCase(d.returns, d.payments, d.seq).execute("s1", ret.id, "cash", NOW),
    /ใบลดหนี้/,
  );
});
