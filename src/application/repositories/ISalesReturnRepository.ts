import type { SalesReturn, SalesReturnWithLines, SalesReturnStatus } from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreateSalesReturnLineInput {
  productId: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface CreateSalesReturnInput {
  shopId: string;
  docNumber: string;
  invoiceId: string | null;
  salesOrderId: string | null;
  customerId: string;
  status: SalesReturnStatus;
  currency: string;
  untaxedAmount: number;
  taxAmount: number;
  totalAmount: number;
  reason: string | null;
  lines: CreateSalesReturnLineInput[];
}

export interface ISalesReturnRepository {
  createWithLines(input: CreateSalesReturnInput): Promise<SalesReturn>;
  findById(shopId: string, id: string): Promise<SalesReturnWithLines | null>;
  list(shopId: string, query: PageQuery): Promise<Page<SalesReturn>>;
  listByInvoice(shopId: string, invoiceId: string): Promise<SalesReturn[]>;
  update(
    shopId: string,
    id: string,
    patch: { status?: SalesReturnStatus; refundedAmount?: number },
  ): Promise<SalesReturn>;
}
