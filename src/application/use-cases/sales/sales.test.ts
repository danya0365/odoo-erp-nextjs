import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  SalesOrder,
  SalesOrderLine,
  SalesOrderWithLines,
  Invoice,
  Payment,
} from "@/src/domain/entities";
import type {
  CreateSalesOrderInput,
  SalesOrderHeaderPatch,
  SalesLineProgressPatch,
  ISalesOrderRepository,
} from "@/src/application/repositories/ISalesOrderRepository";
import type {
  CreateInvoiceInput,
  IInvoiceRepository,
} from "@/src/application/repositories/IInvoiceRepository";
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

import { CreateQuotationUseCase } from "./CreateQuotationUseCase";
import { ConfirmSalesOrderUseCase } from "./ConfirmSalesOrderUseCase";
import { DeliverSalesOrderUseCase } from "./DeliverSalesOrderUseCase";
import { InvoiceSalesOrderUseCase } from "./InvoiceSalesOrderUseCase";
import { RegisterInvoicePaymentUseCase } from "./RegisterInvoicePaymentUseCase";

const NOW = "2026-01-01T00:00:00.000Z";

class FakeSalesRepo implements ISalesOrderRepository {
  orders = new Map<string, SalesOrder>();
  lines: SalesOrderLine[] = [];
  private seq = 0;
  async createWithLines(input: CreateSalesOrderInput): Promise<SalesOrder> {
    const oid = `so${++this.seq}`;
    const order: SalesOrder = {
      id: oid,
      shopId: input.shopId,
      docNumber: null,
      customerId: input.customerId,
      status: "draft",
      currency: input.currency,
      untaxedAmount: input.untaxedAmount,
      taxAmount: input.taxAmount,
      totalAmount: input.totalAmount,
      orderDate: input.orderDate,
      confirmedAt: null,
      note: input.note ?? null,
      createdAt: NOW,
      updatedAt: NOW,
    };
    this.orders.set(oid, order);
    input.lines.forEach((l, i) =>
      this.lines.push({
        id: `${oid}-l${i}`,
        shopId: input.shopId,
        salesOrderId: oid,
        productId: l.productId,
        description: l.description,
        qtyOrdered: l.qtyOrdered,
        qtyDelivered: 0,
        qtyInvoiced: 0,
        unitPrice: l.unitPrice,
        taxRateBp: l.taxRateBp,
        lineSubtotal: l.lineSubtotal,
        lineTax: l.lineTax,
        lineTotal: l.lineTotal,
      }),
    );
    return order;
  }
  async findById(shopId: string, id: string): Promise<SalesOrderWithLines | null> {
    const o = this.orders.get(id);
    if (!o || o.shopId !== shopId) return null;
    return { ...o, lines: this.lines.filter((l) => l.salesOrderId === id) };
  }
  async list(): Promise<Page<SalesOrder>> {
    return { items: [...this.orders.values()], total: this.orders.size, page: 1, pageSize: 20 };
  }
  async update(shopId: string, id: string, patch: SalesOrderHeaderPatch): Promise<SalesOrder> {
    const o = this.orders.get(id)!;
    Object.assign(o, patch);
    return o;
  }
  async updateLines(_shopId: string, updates: SalesLineProgressPatch[]): Promise<void> {
    for (const u of updates) {
      const l = this.lines.find((x) => x.id === u.id)!;
      if (u.qtyDelivered !== undefined) l.qtyDelivered = u.qtyDelivered;
      if (u.qtyInvoiced !== undefined) l.qtyInvoiced = u.qtyInvoiced;
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

class FakeInvoiceRepo implements IInvoiceRepository {
  invoices = new Map<string, Invoice>();
  private seq = 0;
  async createWithLines(input: CreateInvoiceInput): Promise<Invoice> {
    const iid = `inv${++this.seq}`;
    const inv: Invoice = {
      id: iid,
      shopId: input.shopId,
      docNumber: input.docNumber,
      salesOrderId: input.salesOrderId,
      customerId: input.customerId,
      status: input.status,
      currency: input.currency,
      untaxedAmount: input.untaxedAmount,
      taxAmount: input.taxAmount,
      totalAmount: input.totalAmount,
      amountPaid: 0,
      dueDate: null,
      createdAt: NOW,
      updatedAt: NOW,
    };
    this.invoices.set(iid, inv);
    return inv;
  }
  async findById(shopId: string, id: string) {
    const i = this.invoices.get(id);
    return i && i.shopId === shopId ? i : null;
  }
  async listBySalesOrder() {
    return [];
  }
  async list(): Promise<Page<Invoice>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
  async update(shopId: string, id: string, patch: { status?: Invoice["status"]; amountPaid?: number }) {
    const i = this.invoices.get(id)!;
    Object.assign(i, patch);
    return i;
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

// helper: สร้าง quotation 1 บรรทัด (qty 2, ราคา 100, ภาษี 7%)
async function makeQuotation(sales: FakeSalesRepo) {
  return new CreateQuotationUseCase(sales).execute({
    shopId: "s1",
    customerId: "cust1",
    orderDate: NOW,
    lines: [{ productId: "p1", description: "สินค้า", qtyOrdered: 2000, unitPrice: 100, taxRateBp: 700 }],
  });
}

test("CreateQuotation: คำนวณยอด + สถานะ draft", async () => {
  const sales = new FakeSalesRepo();
  const so = await makeQuotation(sales);
  // qty 2 × 100 = 200 ; tax 7% = 14 ; total 214
  assert.equal(so.untaxedAmount, 200);
  assert.equal(so.taxAmount, 14);
  assert.equal(so.totalAmount, 214);
  assert.equal(so.status, "draft");
  assert.equal(so.docNumber, null);
});

test("Confirm: ออกเลข SO00001 + กัน confirm ซ้ำ", async () => {
  const sales = new FakeSalesRepo();
  const seq = new FakeSequenceRepo();
  const so = await makeQuotation(sales);
  const confirm = new ConfirmSalesOrderUseCase(sales, seq);
  const confirmed = await confirm.execute("s1", so.id, NOW);
  assert.equal(confirmed.docNumber, "SO00001");
  assert.equal(confirmed.status, "confirmed");
  await assert.rejects(() => confirm.execute("s1", so.id, NOW), /สถานะร่าง/);
});

test("Deliver: partial → delivered + เขียน stock OUT + กันส่งเกิน", async () => {
  const sales = new FakeSalesRepo();
  const seq = new FakeSequenceRepo();
  const moves = new FakeStockMoveRepo();
  const locations = new FakeLocationRepo();
  const so = await makeQuotation(sales);
  await new ConfirmSalesOrderUseCase(sales, seq).execute("s1", so.id, NOW);
  const deliver = new DeliverSalesOrderUseCase(sales, moves, locations);
  const line = (await sales.findById("s1", so.id))!.lines[0];

  // ส่ง 1 (จาก 2) → partially_delivered, OUT -1000
  let res = await deliver.execute("s1", so.id, [{ lineId: line.id, qty: 1000 }]);
  assert.equal(res.status, "partially_delivered");
  assert.equal(moves.moves[0].qtyDelta, -1000);
  assert.equal(moves.moves[0].type, "out");

  // ส่งเกินที่เหลือ (เหลือ 1 แต่ส่ง 2) → error
  await assert.rejects(
    () => deliver.execute("s1", so.id, [{ lineId: line.id, qty: 2000 }]),
    /เกินจำนวน/,
  );

  // ส่งที่เหลือ 1 → delivered
  res = await deliver.execute("s1", so.id, [{ lineId: line.id, qty: 1000 }]);
  assert.equal(res.status, "delivered");
});

test("Invoice + Payment: delivered → invoiced → done", async () => {
  const sales = new FakeSalesRepo();
  const seq = new FakeSequenceRepo();
  const moves = new FakeStockMoveRepo();
  const locations = new FakeLocationRepo();
  const invoices = new FakeInvoiceRepo();
  const payments = new FakePaymentRepo();

  const so = await makeQuotation(sales);
  await new ConfirmSalesOrderUseCase(sales, seq).execute("s1", so.id, NOW);
  const line = (await sales.findById("s1", so.id))!.lines[0];
  await new DeliverSalesOrderUseCase(sales, moves, locations).execute("s1", so.id, [
    { lineId: line.id, qty: 2000 },
  ]);

  const invoice = await new InvoiceSalesOrderUseCase(sales, invoices, seq).execute("s1", so.id);
  assert.equal(invoice.docNumber, "INV00001");
  assert.equal(invoice.totalAmount, 214);
  assert.equal((await sales.findById("s1", so.id))!.status, "invoiced");

  // จ่ายครบ → invoice paid + SO done
  const pay = new RegisterInvoicePaymentUseCase(invoices, payments, sales, seq);
  const payment = await pay.execute("s1", invoice.id, 214, "cash", NOW);
  assert.equal(payment.docNumber, "PAY00001");
  assert.equal((await invoices.findById("s1", invoice.id))!.status, "paid");
  assert.equal((await sales.findById("s1", so.id))!.status, "done");

  // จ่ายซ้ำ → error
  await assert.rejects(() => pay.execute("s1", invoice.id, 1, "cash", NOW), /ชำระครบแล้ว/);
});

test("Invoice: กันออกใบแจ้งหนี้ก่อนส่งครบ", async () => {
  const sales = new FakeSalesRepo();
  const seq = new FakeSequenceRepo();
  const invoices = new FakeInvoiceRepo();
  const so = await makeQuotation(sales);
  await new ConfirmSalesOrderUseCase(sales, seq).execute("s1", so.id, NOW);
  await assert.rejects(
    () => new InvoiceSalesOrderUseCase(sales, invoices, seq).execute("s1", so.id),
    /ส่งครบ/,
  );
});
