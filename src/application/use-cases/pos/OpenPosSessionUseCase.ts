import type { PosSession } from "@/src/domain/entities";
import type { IPosSessionRepository } from "@/src/application/repositories/IPosSessionRepository";

/** เปิดกะ POS — หนึ่ง shop มีได้กะเดียวที่เปิดอยู่ */
export class OpenPosSessionUseCase {
  constructor(private readonly sessions: IPosSessionRepository) {}

  async execute(
    shopId: string,
    userId: string,
    openingCash: number,
    now: string,
  ): Promise<PosSession> {
    if (openingCash < 0) throw new Error("เงินตั้งต้นต้องไม่ติดลบ");
    const open = await this.sessions.findOpen(shopId);
    if (open) throw new Error("มีกะที่เปิดอยู่แล้ว ต้องปิดกะก่อน");
    return this.sessions.open({ shopId, userId, openingCash, openedAt: now });
  }
}
