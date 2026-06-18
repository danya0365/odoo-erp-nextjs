import type { Payment, PaymentDirection } from "@/src/domain/entities";

export interface CreatePaymentInput {
  shopId: string;
  docNumber: string;
  partnerId: string;
  direction: PaymentDirection;
  invoiceId?: string | null;
  vendorBillId?: string | null;
  amount: number;
  method: string;
  paidAt: string;
}

export interface IPaymentRepository {
  create(input: CreatePaymentInput): Promise<Payment>;
  listByInvoice(shopId: string, invoiceId: string): Promise<Payment[]>;
}
