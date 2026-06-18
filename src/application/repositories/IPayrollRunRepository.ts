import type { PayrollRun, PayrollRunStatus, PayrollRunWithSlips } from "@/src/domain/entities";

export interface CreatePayslipInput {
  employeeId: string;
  gross: number;
  tax: number;
  net: number;
}

export interface CreatePayrollRunInput {
  shopId: string;
  period: string;
  whtRateBp: number;
  slips: CreatePayslipInput[];
}

export interface PayrollRunPatch {
  docNumber?: string;
  status?: PayrollRunStatus;
}

export interface IPayrollRunRepository {
  createWithSlips(input: CreatePayrollRunInput): Promise<PayrollRun>;
  findById(shopId: string, id: string): Promise<PayrollRunWithSlips | null>;
  list(shopId: string): Promise<PayrollRun[]>;
  update(shopId: string, id: string, patch: PayrollRunPatch): Promise<PayrollRun>;
}
