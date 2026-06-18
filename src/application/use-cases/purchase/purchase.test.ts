import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderWithLines,
  VendorBill,
  Payment,
} from "@/src/domain/entities";
import type {
  CreatePurchaseOrderInput,
  PurchaseOrderHeaderPatch,
  PurchaseLineProgressPatch,
  IPurchaseOrderRepository,
} from "@/src/application/repositories/IPurchaseOrderRepository";
import type {
  CreateVendorBillInput,
  IVendorBillRepository,
} from "@/src/application/repositories/IVendorBillRepository";
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

import { CreateRfqUseCase } from "./CreateRfqUseCase";
import { ConfirmPurchaseOrderUseCase } from "./ConfirmPurchaseOrderUseCase";
import { ReceivePurchaseOrderUseCase } from "./ReceivePurchaseOrderUseCase";
import { CreateVendorBillUseCase } from "./CreateVendorBillUseCase";
import { RegisterBillPaymentUseCase } from "./RegisterBillPaymentUseCase";

const NOW = "2026-01-01T00:00:00.000Z";

class FakePurchaseRepo implements IPurchaseOrderRepository {
  orders = new Map<string, PurchaseOrder>();
  lines: PurchaseOrderLine[] = [];
  private seq = 0;
  async createWithLines(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    const oid = `po${++this.seq}`;
    const order: PurchaseOrder = {
      id: oid, shopId: input.shopId, docNumber: null, vendorId: input.vendorId,
      status: "rfq", currency: input.currency, untaxedAmount: input.untaxedAmount,
      taxAmount: input.taxAmount, totalAmount: input.totalAmount, orderDate: input.orderDate,
      confirmedAt: null, note: input.note ?? null, createdAt: NOW, updatedAt: NOW,
    };
    this.orders.set(oid, order);
    input.lines.forEach((l, i) =>
      this.lines.push({
        id: `${oid}-l${i}`, shopId: input.shopId, purchaseOrderId: oid, productId: l.productId,
        description: l.description, qtyOrdered: l.qtyOrdered, qtyReceived: 0, qtyBilled: 0,
        unitPrice: l.unitPrice, taxRateBp: l.taxRateBp, lineSubtotal: l.lineSubtotal,
        lineTax: l.lineTax, lineTotal: l.lineTotal,
      }),
    );
    return order;
  }
  async findById(shopId: string, id: string): Promise<PurchaseOrderWithLines | null> {
    const o = this.orders.get(id);
    if (!o || o.shopId !== shopId) return null;
    return { ...o, lines: this.lines.filter((l) => l.purchaseOrderId === id) };
  }
  async list(): Promise<Page<PurchaseOrder>> {
    return { items: [...this.orders.values()], total: this.orders.size, page: 1, pageSize: 20 };
  }
  async update(_s: string, id: string, patch: PurchaseOrderHeaderPatch): Promise<PurchaseOrder> {
    const o = this.orders.get(id)!;
    Object.assign(o, patch);
    return o;
  }
  async updateLines(_s: string, updates: PurchaseLineProgressPatch[]): Promise<void> {
    for (const u of updates) {
      const l = this.lines.find((x) => x.id === u.id)!;
      if (u.qtyReceived !== undefined) l.qtyReceived = u.qtyReceived;
      if (u.qtyBilled !== undefined) l.qtyBilled = u.qtyBilled;
    }
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
class FakeBillRepo implements IVendorBillRepository {
  bills = new Map<string, VendorBill>();
  private seq = 0;
  async createWithLines(input: CreateVendorBillInput): Promise<VendorBill> {
    const bid = `vb${++this.seq}`;
    const bill: VendorBill = {
      id: bid, shopId: input.shopId, docNumber: input.docNumber, purchaseOrderId: input.purchaseOrderId,
      vendorId: input.vendorId, status: input.status, currency: input.currency,
      untaxedAmount: input.untaxedAmount, taxAmount: input.taxAmount, totalAmount: input.totalAmount,
      amountPaid: 0, dueDate: null, createdAt: NOW, updatedAt: NOW,
    };
    this.bills.set(bid, bill);
    return bill;
  }
  async findById(shopId: string, id: string) {
    const b = this.bills.get(id);
    return b && b.shopId === shopId ? b : null;
  }
  async listByPurchaseOrder() {
    return [];
  }
  async list(): Promise<Page<VendorBill>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
  async update(_s: string, id: string, patch: { status?: VendorBill["status"]; amountPaid?: number }) {
    const b = this.bills.get(id)!;
    Object.assign(b, patch);
    return b;
  }
}
class FakePaymentRepo implements IPaymentRepository {
  payments: Payment[] = [];
  private seq = 0;
  async create(input: CreatePaymentInput): Promise<Payment> {
    const p: Payment = { id: `pay${++this.seq}`, createdAt: NOW, invoiceId: input.invoiceId ?? null, vendorBillId: input.vendorBillId ?? null, ...input };
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

async function makeRfq(po: FakePurchaseRepo) {
  return new CreateRfqUseCase(po).execute({
    shopId: "s1", vendorId: "v1", orderDate: NOW,
    lines: [{ productId: "p1", description: "วัตถุดิบ", qtyOrdered: 5000, unitPrice: 80, taxRateBp: 700 }],
  });
}

test("CreateRfq: คำนวณยอด + สถานะ rfq", async () => {
  const po = new FakePurchaseRepo();
  const order = await makeRfq(po);
  // qty 5 × 80 = 400 ; tax 7% = 28 ; total 428
  assert.equal(order.untaxedAmount, 400);
  assert.equal(order.taxAmount, 28);
  assert.equal(order.totalAmount, 428);
  assert.equal(order.status, "rfq");
});

test("Confirm: ออกเลข PO00001 + กันยืนยันซ้ำ", async () => {
  const po = new FakePurchaseRepo();
  const seq = new FakeSequenceRepo();
  const order = await makeRfq(po);
  const confirm = new ConfirmPurchaseOrderUseCase(po, seq);
  const c = await confirm.execute("s1", order.id, NOW);
  assert.equal(c.docNumber, "PO00001");
  assert.equal(c.status, "confirmed");
  await assert.rejects(() => confirm.execute("s1", order.id, NOW), /RFQ/);
});

test("Receive: partial → received + stock IN + กันรับเกิน", async () => {
  const po = new FakePurchaseRepo();
  const seq = new FakeSequenceRepo();
  const moves = new FakeStockMoveRepo();
  const locations = new FakeLocationRepo();
  const order = await makeRfq(po);
  await new ConfirmPurchaseOrderUseCase(po, seq).execute("s1", order.id, NOW);
  const receive = new ReceivePurchaseOrderUseCase(po, moves, locations);
  const line = (await po.findById("s1", order.id))!.lines[0];

  let res = await receive.execute("s1", order.id, [{ lineId: line.id, qty: 2000 }]);
  assert.equal(res.status, "partially_received");
  assert.equal(moves.moves[0].qtyDelta, 2000); // IN บวก
  assert.equal(moves.moves[0].type, "in");

  await assert.rejects(
    () => receive.execute("s1", order.id, [{ lineId: line.id, qty: 4000 }]),
    /เกินจำนวน/,
  );

  res = await receive.execute("s1", order.id, [{ lineId: line.id, qty: 3000 }]);
  assert.equal(res.status, "received");
});

test("Bill + Payment: received → billed → done", async () => {
  const po = new FakePurchaseRepo();
  const seq = new FakeSequenceRepo();
  const moves = new FakeStockMoveRepo();
  const locations = new FakeLocationRepo();
  const bills = new FakeBillRepo();
  const payments = new FakePaymentRepo();

  const order = await makeRfq(po);
  await new ConfirmPurchaseOrderUseCase(po, seq).execute("s1", order.id, NOW);
  const line = (await po.findById("s1", order.id))!.lines[0];
  await new ReceivePurchaseOrderUseCase(po, moves, locations).execute("s1", order.id, [
    { lineId: line.id, qty: 5000 },
  ]);

  const bill = await new CreateVendorBillUseCase(po, bills, seq).execute("s1", order.id);
  assert.equal(bill.docNumber, "BILL00001");
  assert.equal(bill.totalAmount, 428);
  assert.equal((await po.findById("s1", order.id))!.status, "billed");

  const pay = new RegisterBillPaymentUseCase(bills, payments, po, seq);
  const payment = await pay.execute("s1", bill.id, 428, "cash", NOW);
  assert.equal(payment.direction, "outbound");
  assert.equal((await bills.findById("s1", bill.id))!.status, "paid");
  assert.equal((await po.findById("s1", order.id))!.status, "done");
  await assert.rejects(() => pay.execute("s1", bill.id, 1, "cash", NOW), /จ่ายครบแล้ว/);
});
