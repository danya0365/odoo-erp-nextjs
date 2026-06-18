import type { Opportunity } from "@/src/domain/entities";
import { canReopen } from "@/src/domain/services/crm-status";
import type { IOpportunityRepository } from "@/src/application/repositories/IOpportunityRepository";

/** เปิดโอกาสการขายที่ปิดไปแล้ว (won/lost) กลับมาเป็น active */
export class ReopenOpportunityUseCase {
  constructor(private readonly opportunities: IOpportunityRepository) {}

  async execute(shopId: string, id: string): Promise<Opportunity> {
    const opp = await this.opportunities.findById(shopId, id);
    if (!opp) throw new Error("ไม่พบโอกาสการขาย");
    if (!canReopen(opp.status)) throw new Error("รายการนี้เปิดอยู่แล้ว");
    return this.opportunities.update(shopId, id, { status: "active", lostReason: null });
  }
}
