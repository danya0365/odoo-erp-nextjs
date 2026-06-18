import type { PosSession } from "@/src/domain/entities";
import { expectedCash, cashDifference } from "@/src/domain/services/pos";
import type { IPosSessionRepository } from "@/src/application/repositories/IPosSessionRepository";
import type { IPosOrderRepository } from "@/src/application/repositories/IPosOrderRepository";

/** ปิดกะ — กระทบเงินสด: ที่ควรมี = ตั้งต้น + ขายเงินสด, ผลต่าง = นับจริง − ที่ควรมี */
export class ClosePosSessionUseCase {
  constructor(
    private readonly sessions: IPosSessionRepository,
    private readonly posOrders: IPosOrderRepository,
  ) {}

  async execute(
    shopId: string,
    sessionId: string,
    countedCash: number,
    now: string,
  ): Promise<PosSession> {
    const session = await this.sessions.findById(shopId, sessionId);
    if (!session) throw new Error("ไม่พบกะ");
    if (session.status !== "open") throw new Error("กะนี้ปิดแล้ว");
    if (countedCash < 0) throw new Error("ยอดเงินนับได้ต้องไม่ติดลบ");

    const cashSales = await this.posOrders.cashTotalBySession(shopId, sessionId);
    const expected = expectedCash(session.openingCash, cashSales);
    return this.sessions.close(shopId, sessionId, {
      closingCash: countedCash,
      expectedCash: expected,
      difference: cashDifference(countedCash, expected),
      closedAt: now,
    });
  }
}
