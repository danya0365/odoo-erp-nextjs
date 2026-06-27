import type { ExpenseClaim, ExpenseClaimStatus } from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreateExpenseClaimInput {
  shopId: string;
  docNumber: string;
  employeeId: string;
  category: string;
  description: string;
  amount: number;
}

export interface IExpenseClaimRepository {
  create(input: CreateExpenseClaimInput): Promise<ExpenseClaim>;
  findById(shopId: string, id: string): Promise<ExpenseClaim | null>;
  list(shopId: string, query: PageQuery): Promise<Page<ExpenseClaim>>;
  update(
    shopId: string,
    id: string,
    patch: { status?: ExpenseClaimStatus; paidAt?: string | null },
  ): Promise<ExpenseClaim>;
}
