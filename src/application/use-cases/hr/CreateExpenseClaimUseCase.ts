import type { ExpenseClaim } from "@/src/domain/entities";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IExpenseClaimRepository } from "@/src/application/repositories/IExpenseClaimRepository";
import type { IEmployeeRepository } from "@/src/application/repositories/IEmployeeRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

export interface ExpenseClaimInput {
  employeeId: string;
  category: string;
  description: string;
  amount: number; // minor units
}

/** พนักงานยื่นเบิกค่าใช้จ่าย (สถานะ submitted) */
export class CreateExpenseClaimUseCase {
  constructor(
    private readonly claims: IExpenseClaimRepository,
    private readonly employees: IEmployeeRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(shopId: string, input: ExpenseClaimInput): Promise<ExpenseClaim> {
    const emp = await this.employees.findById(shopId, input.employeeId);
    if (!emp) throw new Error("ไม่พบพนักงาน");
    if (input.amount <= 0) throw new Error("จำนวนเงินต้องมากกว่า 0");

    const seq = await this.sequences.next(shopId, "expense_claim");
    return this.claims.create({
      shopId,
      docNumber: formatDocNumber("EXP", seq, 5),
      employeeId: input.employeeId,
      category: input.category,
      description: input.description,
      amount: input.amount,
    });
  }
}
