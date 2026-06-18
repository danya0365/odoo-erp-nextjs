import type { Opportunity } from "@/src/domain/entities";
import type { ICrmStageRepository } from "@/src/application/repositories/ICrmStageRepository";
import type { IOpportunityRepository } from "@/src/application/repositories/IOpportunityRepository";

/** ย้ายสเตจใน pipeline — เข้าสเตจ "ชนะ" = won (prob 100), สเตจอื่น = active */
export class MoveStageUseCase {
  constructor(
    private readonly stages: ICrmStageRepository,
    private readonly opportunities: IOpportunityRepository,
  ) {}

  async execute(shopId: string, id: string, stageId: string): Promise<Opportunity> {
    const opp = await this.opportunities.findById(shopId, id);
    if (!opp) throw new Error("ไม่พบโอกาสการขาย");
    const stage = await this.stages.findById(shopId, stageId);
    if (!stage) throw new Error("ไม่พบสเตจ");

    const patch = stage.isWon
      ? { stageId, status: "won" as const, probability: 100 }
      : { stageId, status: "active" as const };
    return this.opportunities.update(shopId, id, patch);
  }
}
