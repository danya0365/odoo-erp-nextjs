import type { SalesOrder } from "@/src/domain/entities";
import type { ICrmStageRepository } from "@/src/application/repositories/ICrmStageRepository";
import type { IOpportunityRepository } from "@/src/application/repositories/IOpportunityRepository";
import type { ISalesOrderRepository } from "@/src/application/repositories/ISalesOrderRepository";

/**
 * แปลงโอกาสการขายเป็นใบเสนอราคา (cross-module) — สร้าง quotation draft เปล่า
 * ผูกลูกค้าเดียวกัน, ตั้งโอกาส = ชนะ + ย้ายเข้าสเตจชนะ + เก็บ salesOrderId
 */
export class ConvertToQuotationUseCase {
  constructor(
    private readonly opportunities: IOpportunityRepository,
    private readonly salesOrders: ISalesOrderRepository,
    private readonly stages: ICrmStageRepository,
  ) {}

  async execute(shopId: string, id: string, now: string): Promise<SalesOrder> {
    const opp = await this.opportunities.findById(shopId, id);
    if (!opp) throw new Error("ไม่พบโอกาสการขาย");
    if (!opp.partnerId) throw new Error("ต้องระบุลูกค้าก่อนแปลงเป็นใบเสนอราคา");
    if (opp.salesOrderId) throw new Error("แปลงเป็นใบเสนอราคาไปแล้ว");

    const order = await this.salesOrders.createWithLines({
      shopId,
      customerId: opp.partnerId,
      currency: "THB",
      orderDate: now,
      note: `จากโอกาสการขาย: ${opp.name}`,
      untaxedAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      lines: [],
    });

    const stages = await this.stages.ensureDefaults(shopId);
    const wonStage = stages.find((s) => s.isWon);
    await this.opportunities.update(shopId, id, {
      salesOrderId: order.id,
      status: "won",
      probability: 100,
      ...(wonStage && { stageId: wonStage.id }),
    });
    return order;
  }
}
