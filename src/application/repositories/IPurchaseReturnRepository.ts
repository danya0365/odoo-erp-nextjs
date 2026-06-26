import type { PurchaseReturn, PurchaseReturnWithLines, PurchaseReturnStatus } from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreatePurchaseReturnLineInput {
  productId: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface CreatePurchaseReturnInput {
  shopId: string;
  docNumber: string;
  vendorBillId: string | null;
  purchaseOrderId: string | null;
  vendorId: string;
  status: PurchaseReturnStatus;
  currency: string;
  untaxedAmount: number;
  taxAmount: number;
  totalAmount: number;
  reason: string | null;
  lines: CreatePurchaseReturnLineInput[];
}

export interface IPurchaseReturnRepository {
  createWithLines(input: CreatePurchaseReturnInput): Promise<PurchaseReturn>;
  findById(shopId: string, id: string): Promise<PurchaseReturnWithLines | null>;
  list(shopId: string, query: PageQuery): Promise<Page<PurchaseReturn>>;
  update(shopId: string, id: string, patch: { status?: PurchaseReturnStatus }): Promise<PurchaseReturn>;
}
