import type { DunningLog } from "@/src/domain/entities";

export interface CreateDunningLogInput {
  shopId: string;
  customerId: string;
  amount: number;
  note: string | null;
  sentAt: string;
}

export interface IDunningLogRepository {
  create(input: CreateDunningLogInput): Promise<DunningLog>;
  /** ครั้งล่าสุดที่ทวงต่อลูกค้า (map customerId → sentAt) */
  latestByCustomer(shopId: string): Promise<Map<string, string>>;
}
