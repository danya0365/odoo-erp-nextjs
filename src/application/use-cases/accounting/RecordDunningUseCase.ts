import type { DunningLog } from "@/src/domain/entities";
import type { IDunningLogRepository } from "@/src/application/repositories/IDunningLogRepository";

/** บันทึกการส่งใบทวงหนี้ลูกค้า (outbox) */
export class RecordDunningUseCase {
  constructor(private readonly dunning: IDunningLogRepository) {}

  async execute(
    shopId: string,
    customerId: string,
    amount: number,
    note: string | null,
    sentAt: string,
  ): Promise<DunningLog> {
    if (amount <= 0) throw new Error("ไม่มียอดค้างให้ทวง");
    return this.dunning.create({ shopId, customerId, amount, note, sentAt });
  }
}
