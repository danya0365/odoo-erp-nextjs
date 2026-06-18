import type {
  SalesOrder,
  SalesOrderWithLines,
  SalesOrderStatus,
} from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreateSalesOrderLineInput {
  productId: string;
  description: string;
  qtyOrdered: number;
  unitPrice: number;
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface CreateSalesOrderInput {
  shopId: string;
  customerId: string;
  currency: string;
  orderDate: string;
  note?: string | null;
  untaxedAmount: number;
  taxAmount: number;
  totalAmount: number;
  lines: CreateSalesOrderLineInput[];
}

export interface SalesOrderHeaderPatch {
  docNumber?: string;
  status?: SalesOrderStatus;
  confirmedAt?: string;
}

export interface SalesLineProgressPatch {
  id: string;
  qtyDelivered?: number;
  qtyInvoiced?: number;
}

export interface ISalesOrderRepository {
  createWithLines(input: CreateSalesOrderInput): Promise<SalesOrder>;
  findById(shopId: string, id: string): Promise<SalesOrderWithLines | null>;
  list(shopId: string, query: PageQuery): Promise<Page<SalesOrder>>;
  update(shopId: string, id: string, patch: SalesOrderHeaderPatch): Promise<SalesOrder>;
  updateLines(shopId: string, updates: SalesLineProgressPatch[]): Promise<void>;
}
