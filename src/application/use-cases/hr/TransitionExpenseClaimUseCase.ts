import type { ExpenseClaim } from "@/src/domain/entities";
import { canApprove, canReject, canPay } from "@/src/domain/services/expense-claim-status";
import type { IExpenseClaimRepository } from "@/src/application/repositories/IExpenseClaimRepository";

/** อนุมัติ/ปฏิเสธ/จ่ายคืน ใบเบิกค่าใช้จ่าย (guard ด้วย state machine) */
export class ApproveExpenseClaimUseCase {
  constructor(private readonly claims: IExpenseClaimRepository) {}
  async execute(shopId: string, id: string): Promise<ExpenseClaim> {
    const c = await this.claims.findById(shopId, id);
    if (!c) throw new Error("ไม่พบใบเบิก");
    if (!canApprove(c.status)) throw new Error("อนุมัติได้เฉพาะใบที่รออนุมัติ");
    return this.claims.update(shopId, id, { status: "approved" });
  }
}

export class RejectExpenseClaimUseCase {
  constructor(private readonly claims: IExpenseClaimRepository) {}
  async execute(shopId: string, id: string): Promise<ExpenseClaim> {
    const c = await this.claims.findById(shopId, id);
    if (!c) throw new Error("ไม่พบใบเบิก");
    if (!canReject(c.status)) throw new Error("ปฏิเสธได้เฉพาะใบที่รออนุมัติ");
    return this.claims.update(shopId, id, { status: "rejected" });
  }
}

/** จ่ายคืน: ต้องอนุมัติแล้ว → paid + บันทึกวันจ่าย (action ลงบัญชีต่อ) */
export class PayExpenseClaimUseCase {
  constructor(private readonly claims: IExpenseClaimRepository) {}
  async execute(shopId: string, id: string, paidAt: string): Promise<ExpenseClaim> {
    const c = await this.claims.findById(shopId, id);
    if (!c) throw new Error("ไม่พบใบเบิก");
    if (!canPay(c.status)) throw new Error("จ่ายได้เฉพาะใบที่อนุมัติแล้ว");
    return this.claims.update(shopId, id, { status: "paid", paidAt });
  }
}
