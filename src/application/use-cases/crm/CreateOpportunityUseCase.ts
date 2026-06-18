import type { Opportunity } from "@/src/domain/entities";
import { clampProbability } from "@/src/domain/services/crm-status";
import type { ICrmStageRepository } from "@/src/application/repositories/ICrmStageRepository";
import type { IOpportunityRepository } from "@/src/application/repositories/IOpportunityRepository";

export interface CreateOpportunityParams {
  shopId: string;
  name: string;
  partnerId?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  expectedRevenue: number;
  probability: number;
  stageId?: string; // ไม่ระบุ = สเตจแรกของ pipeline
}

/** สร้างโอกาสการขายใหม่ — ลงสเตจแรกถ้าไม่ระบุ + บีบ probability 0–100 */
export class CreateOpportunityUseCase {
  constructor(
    private readonly stages: ICrmStageRepository,
    private readonly opportunities: IOpportunityRepository,
  ) {}

  async execute(p: CreateOpportunityParams): Promise<Opportunity> {
    if (!p.name?.trim()) throw new Error("กรุณาระบุชื่อโอกาสการขาย");
    const stages = await this.stages.ensureDefaults(p.shopId);
    const stageId = p.stageId ?? stages[0]?.id;
    if (!stageId) throw new Error("ไม่พบสเตจใน pipeline");

    return this.opportunities.create({
      shopId: p.shopId,
      name: p.name.trim(),
      partnerId: p.partnerId ?? null,
      contactName: p.contactName ?? null,
      email: p.email ?? null,
      phone: p.phone ?? null,
      expectedRevenue: Math.max(0, p.expectedRevenue),
      probability: clampProbability(p.probability),
      stageId,
    });
  }
}
