import type { BankStatementLine, PeriodClose } from "@/src/domain/entities";

export interface CreateBankStatementLineInput {
  shopId: string;
  statementDate: string;
  description: string;
  amount: number;
}

export interface IBankStatementRepository {
  create(input: CreateBankStatementLineInput): Promise<BankStatementLine>;
  list(shopId: string): Promise<BankStatementLine[]>;
  setReconciled(shopId: string, id: string, reconciled: boolean): Promise<void>;
}

export interface CreatePeriodCloseInput {
  shopId: string;
  period: string;
  note: string | null;
  closedAt: string;
}

export interface IPeriodCloseRepository {
  create(input: CreatePeriodCloseInput): Promise<PeriodClose>;
  list(shopId: string): Promise<PeriodClose[]>;
  findByPeriod(shopId: string, period: string): Promise<PeriodClose | null>;
}
