import type { BankStatementLine, PeriodClose } from "@/src/domain/entities";
import type {
  IBankStatementRepository,
  IPeriodCloseRepository,
} from "@/src/application/repositories/IBankReconciliationRepository";

/** นำเข้ารายการเดินบัญชีธนาคารหนึ่งบรรทัด */
export class ImportBankLineUseCase {
  constructor(private readonly bank: IBankStatementRepository) {}
  async execute(shopId: string, statementDate: string, description: string, amount: number): Promise<BankStatementLine> {
    if (amount === 0) throw new Error("จำนวนเงินต้องไม่เป็นศูนย์");
    return this.bank.create({ shopId, statementDate, description, amount });
  }
}

/** กระทบยอด/ยกเลิกกระทบยอด รายการเดินบัญชี */
export class ReconcileBankLineUseCase {
  constructor(private readonly bank: IBankStatementRepository) {}
  async execute(shopId: string, id: string, reconciled: boolean): Promise<void> {
    await this.bank.setReconciled(shopId, id, reconciled);
  }
}

/** ปิดงวดบัญชี (กันปิดซ้ำงวดเดิม) */
export class ClosePeriodUseCase {
  constructor(private readonly periods: IPeriodCloseRepository) {}
  async execute(shopId: string, period: string, note: string | null, closedAt: string): Promise<PeriodClose> {
    if (!/^\d{4}-\d{2}$/.test(period)) throw new Error("งวดไม่ถูกต้อง");
    const existing = await this.periods.findByPeriod(shopId, period);
    if (existing) throw new Error("ปิดงวดนี้ไปแล้ว");
    return this.periods.create({ shopId, period, note, closedAt });
  }
}
