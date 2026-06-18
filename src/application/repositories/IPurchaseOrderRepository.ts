import type {
  PurchaseOrder,
  PurchaseOrderWithLines,
  PurchaseOrderStatus,
} from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreatePurchaseOrderLineInput {
  productId: string;
  description: string;
  qtyOrdered: number;
  unitPrice: number;
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface CreatePurchaseOrderInput {
  shopId: string;
  vendorId: string;
  currency: string;
  orderDate: string;
  note?: string | null;
  untaxedAmount: number;
  taxAmount: number;
  totalAmount: number;
  lines: CreatePurchaseOrderLineInput[];
}

export interface PurchaseOrderHeaderPatch {
  docNumber?: string;
  status?: PurchaseOrderStatus;
  confirmedAt?: string;
}

export interface PurchaseLineProgressPatch {
  id: string;
  qtyReceived?: number;
  qtyBilled?: number;
}

export interface IPurchaseOrderRepository {
  createWithLines(input: CreatePurchaseOrderInput): Promise<PurchaseOrder>;
  findById(shopId: string, id: string): Promise<PurchaseOrderWithLines | null>;
  list(shopId: string, query: PageQuery): Promise<Page<PurchaseOrder>>;
  update(shopId: string, id: string, patch: PurchaseOrderHeaderPatch): Promise<PurchaseOrder>;
  updateLines(shopId: string, updates: PurchaseLineProgressPatch[]): Promise<void>;
}
