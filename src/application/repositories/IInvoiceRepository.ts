import type { Invoice, InvoiceLine, InvoiceStatus } from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreateInvoiceLineInput {
  productId: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface CreateInvoiceInput {
  shopId: string;
  docNumber: string;
  salesOrderId: string | null;
  customerId: string;
  status: InvoiceStatus;
  currency: string;
  untaxedAmount: number;
  taxAmount: number;
  totalAmount: number;
  lines: CreateInvoiceLineInput[];
}

export interface IInvoiceRepository {
  createWithLines(input: CreateInvoiceInput): Promise<Invoice>;
  findById(shopId: string, id: string): Promise<Invoice | null>;
  listLines(shopId: string, invoiceId: string): Promise<InvoiceLine[]>;
  listBySalesOrder(shopId: string, salesOrderId: string): Promise<Invoice[]>;
  list(shopId: string, query: PageQuery): Promise<Page<Invoice>>;
  update(
    shopId: string,
    id: string,
    patch: { status?: InvoiceStatus; amountPaid?: number },
  ): Promise<Invoice>;
}
