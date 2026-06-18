import type { Opportunity, OpportunityStatus } from "@/src/domain/entities";

export interface CreateOpportunityInput {
  shopId: string;
  name: string;
  partnerId?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  expectedRevenue: number;
  probability: number;
  stageId: string;
}

export interface OpportunityPatch {
  stageId?: string;
  status?: OpportunityStatus;
  probability?: number;
  expectedRevenue?: number;
  lostReason?: string | null;
  salesOrderId?: string | null;
}

export interface IOpportunityRepository {
  create(input: CreateOpportunityInput): Promise<Opportunity>;
  findById(shopId: string, id: string): Promise<Opportunity | null>;
  /** ทั้งหมดของ shop (สำหรับ kanban) เรียงล่าสุดก่อน — bounded ที่ MVP */
  listAll(shopId: string): Promise<Opportunity[]>;
  update(shopId: string, id: string, patch: OpportunityPatch): Promise<Opportunity>;
}
