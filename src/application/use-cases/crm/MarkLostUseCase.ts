import type { Opportunity } from "@/src/domain/entities";
import { canMarkLost } from "@/src/domain/services/crm-status";
import type { IOpportunityRepository } from "@/src/application/repositories/IOpportunityRepository";

/** ทำเครื่องหมาย "แพ้" — บันทึกเหตุผล + probability 0 */
export class MarkLostUseCase {
  constructor(private readonly opportunities: IOpportunityRepository) {}

  async execute(shopId: string, id: string, reason: string | null): Promise<Opportunity> {
    const opp = await this.opportunities.findById(shopId, id);
    if (!opp) throw new Error("ไม่พบโอกาสการขาย");
    if (!canMarkLost(opp.status)) throw new Error("ทำเครื่องหมายแพ้ได้เฉพาะรายการที่ยังเปิดอยู่");
    return this.opportunities.update(shopId, id, {
      status: "lost",
      probability: 0,
      lostReason: reason || null,
    });
  }
}
