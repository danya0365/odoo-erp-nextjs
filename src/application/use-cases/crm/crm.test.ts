import { test } from "node:test";
import assert from "node:assert/strict";

import type { CrmStage, Opportunity, SalesOrder } from "@/src/domain/entities";
import { DEFAULT_CRM_STAGES } from "@/src/domain/services/crm-status";
import type { ICrmStageRepository } from "@/src/application/repositories/ICrmStageRepository";
import type {
  CreateOpportunityInput,
  IOpportunityRepository,
  OpportunityPatch,
} from "@/src/application/repositories/IOpportunityRepository";
import type {
  CreateSalesOrderInput,
  ISalesOrderRepository,
} from "@/src/application/repositories/ISalesOrderRepository";
import { CreateOpportunityUseCase } from "./CreateOpportunityUseCase";
import { MoveStageUseCase } from "./MoveStageUseCase";
import { MarkLostUseCase } from "./MarkLostUseCase";
import { ReopenOpportunityUseCase } from "./ReopenOpportunityUseCase";
import { ConvertToQuotationUseCase } from "./ConvertToQuotationUseCase";

let counter = 0;
const uid = () => `id_${++counter}`;
const SHOP = "shop1";

class FakeStages implements ICrmStageRepository {
  private store: CrmStage[] = [];
  async ensureDefaults(shopId: string): Promise<CrmStage[]> {
    if (this.store.length === 0) {
      this.store = DEFAULT_CRM_STAGES.map((s) => ({
        id: uid(), shopId, name: s.name, sequence: s.sequence, isWon: s.isWon,
        createdAt: "t", updatedAt: "t",
      }));
    }
    return [...this.store];
  }
  async list(): Promise<CrmStage[]> {
    return [...this.store];
  }
  async findById(_s: string, id: string): Promise<CrmStage | null> {
    return this.store.find((x) => x.id === id) ?? null;
  }
}

class FakeOpportunities implements IOpportunityRepository {
  store: Opportunity[] = [];
  async create(input: CreateOpportunityInput): Promise<Opportunity> {
    const o: Opportunity = {
      id: uid(), shopId: input.shopId, name: input.name, partnerId: input.partnerId ?? null,
      contactName: input.contactName ?? null, email: input.email ?? null, phone: input.phone ?? null,
      expectedRevenue: input.expectedRevenue, probability: input.probability, stageId: input.stageId,
      status: "active", lostReason: null, salesOrderId: null, createdAt: "t", updatedAt: "t",
    };
    this.store.push(o);
    return o;
  }
  async findById(shopId: string, id: string): Promise<Opportunity | null> {
    return this.store.find((o) => o.shopId === shopId && o.id === id) ?? null;
  }
  async listAll(shopId: string): Promise<Opportunity[]> {
    return this.store.filter((o) => o.shopId === shopId);
  }
  async update(shopId: string, id: string, patch: OpportunityPatch): Promise<Opportunity> {
    const o = this.store.find((x) => x.shopId === shopId && x.id === id)!;
    Object.assign(o, patch);
    return o;
  }
}

class FakeSalesOrders implements ISalesOrderRepository {
  created: SalesOrder[] = [];
  async createWithLines(input: CreateSalesOrderInput): Promise<SalesOrder> {
    const so: SalesOrder = {
      id: uid(), shopId: input.shopId, docNumber: null, customerId: input.customerId,
      status: "draft", currency: input.currency, untaxedAmount: input.untaxedAmount,
      taxAmount: input.taxAmount, totalAmount: input.totalAmount, orderDate: input.orderDate,
      confirmedAt: null, note: input.note ?? null, createdAt: "t", updatedAt: "t",
    };
    this.created.push(so);
    return so;
  }
  async findById() { return null; }
  async list() { return { items: [], total: 0, page: 1, pageSize: 20 }; }
  async update() { return {} as SalesOrder; }
  async updateLines() {}
}

test("CreateOpportunity: ลงสเตจแรก + clamp probability", async () => {
  const stages = new FakeStages();
  const opps = new FakeOpportunities();
  const o = await new CreateOpportunityUseCase(stages, opps).execute({
    shopId: SHOP, name: "ดีลใหญ่", expectedRevenue: 500000, probability: 150,
  });
  const first = (await stages.list())[0];
  assert.equal(o.stageId, first.id);
  assert.equal(o.probability, 100); // clamp
  assert.equal(o.status, "active");
});

test("CreateOpportunity: ชื่อว่าง → error", async () => {
  await assert.rejects(
    () => new CreateOpportunityUseCase(new FakeStages(), new FakeOpportunities()).execute({
      shopId: SHOP, name: "   ", expectedRevenue: 0, probability: 0,
    }),
    /ระบุชื่อ/,
  );
});

test("MoveStage: ย้ายเข้าสเตจชนะ → won + probability 100", async () => {
  const stages = new FakeStages();
  const opps = new FakeOpportunities();
  const o = await new CreateOpportunityUseCase(stages, opps).execute({
    shopId: SHOP, name: "ดีล", expectedRevenue: 1000, probability: 20,
  });
  const won = (await stages.list()).find((s) => s.isWon)!;
  const moved = await new MoveStageUseCase(stages, opps).execute(SHOP, o.id, won.id);
  assert.equal(moved.status, "won");
  assert.equal(moved.probability, 100);
  assert.equal(moved.stageId, won.id);
});

test("MarkLost แล้ว Reopen", async () => {
  const stages = new FakeStages();
  const opps = new FakeOpportunities();
  const o = await new CreateOpportunityUseCase(stages, opps).execute({
    shopId: SHOP, name: "ดีล", expectedRevenue: 1000, probability: 50,
  });
  const lost = await new MarkLostUseCase(opps).execute(SHOP, o.id, "ราคาสูงไป");
  assert.equal(lost.status, "lost");
  assert.equal(lost.probability, 0);
  assert.equal(lost.lostReason, "ราคาสูงไป");
  await assert.rejects(() => new MarkLostUseCase(opps).execute(SHOP, o.id, "x"), /เฉพาะรายการที่ยังเปิด/);

  const reopened = await new ReopenOpportunityUseCase(opps).execute(SHOP, o.id);
  assert.equal(reopened.status, "active");
  assert.equal(reopened.lostReason, null);
});

test("ConvertToQuotation: สร้าง SO draft + ผูก salesOrderId + won (cross-module)", async () => {
  const stages = new FakeStages();
  const opps = new FakeOpportunities();
  const so = new FakeSalesOrders();
  const o = await new CreateOpportunityUseCase(stages, opps).execute({
    shopId: SHOP, name: "ดีล", partnerId: "cust1", expectedRevenue: 1000, probability: 50,
  });
  const order = await new ConvertToQuotationUseCase(opps, so, stages).execute(SHOP, o.id, "t");
  assert.equal(so.created.length, 1);
  assert.equal(order.customerId, "cust1");
  const updated = await opps.findById(SHOP, o.id);
  assert.equal(updated!.salesOrderId, order.id);
  assert.equal(updated!.status, "won");
  // แปลงซ้ำไม่ได้
  await assert.rejects(() => new ConvertToQuotationUseCase(opps, so, stages).execute(SHOP, o.id, "t"), /แปลงเป็นใบเสนอราคาไปแล้ว/);
});

test("ConvertToQuotation: ไม่มีลูกค้า → error", async () => {
  const stages = new FakeStages();
  const opps = new FakeOpportunities();
  const so = new FakeSalesOrders();
  const o = await new CreateOpportunityUseCase(stages, opps).execute({
    shopId: SHOP, name: "ดีลไร้ลูกค้า", expectedRevenue: 1000, probability: 50,
  });
  await assert.rejects(
    () => new ConvertToQuotationUseCase(opps, so, stages).execute(SHOP, o.id, "t"),
    /ต้องระบุลูกค้า/,
  );
});
