import type { VatFiling } from "@/src/domain/entities";

export interface CreateVatFilingInput {
  shopId: string;
  periodStart: string;
  periodEnd: string;
  outputVat: number;
  inputVat: number;
  netPayable: number;
  filedAt: string;
}

export interface IVatFilingRepository {
  create(input: CreateVatFilingInput): Promise<VatFiling>;
  list(shopId: string): Promise<VatFiling[]>;
  findByPeriod(shopId: string, periodStart: string): Promise<VatFiling | null>;
}
