import type { InstallmentPlan, InstallmentPlanWithLines, InstallmentPlanStatus } from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreateInstallmentLineInput {
  seq: number;
  dueDate: string;
  amount: number;
}

export interface CreateInstallmentPlanInput {
  shopId: string;
  invoiceId: string;
  customerId: string;
  totalAmount: number;
  lines: CreateInstallmentLineInput[];
}

export interface IInstallmentPlanRepository {
  createWithLines(input: CreateInstallmentPlanInput): Promise<InstallmentPlan>;
  findById(shopId: string, id: string): Promise<InstallmentPlanWithLines | null>;
  findByInvoice(shopId: string, invoiceId: string): Promise<InstallmentPlan | null>;
  list(shopId: string, query: PageQuery): Promise<Page<InstallmentPlan>>;
  payLine(shopId: string, lineId: string, paidAmount: number): Promise<void>;
  update(shopId: string, id: string, patch: { status?: InstallmentPlanStatus }): Promise<InstallmentPlan>;
}
