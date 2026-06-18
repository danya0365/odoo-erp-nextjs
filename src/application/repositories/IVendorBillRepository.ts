import type { VendorBill, VendorBillStatus } from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreateVendorBillLineInput {
  productId: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface CreateVendorBillInput {
  shopId: string;
  docNumber: string;
  purchaseOrderId: string | null;
  vendorId: string;
  status: VendorBillStatus;
  currency: string;
  untaxedAmount: number;
  taxAmount: number;
  totalAmount: number;
  lines: CreateVendorBillLineInput[];
}

export interface IVendorBillRepository {
  createWithLines(input: CreateVendorBillInput): Promise<VendorBill>;
  findById(shopId: string, id: string): Promise<VendorBill | null>;
  listByPurchaseOrder(shopId: string, purchaseOrderId: string): Promise<VendorBill[]>;
  list(shopId: string, query: PageQuery): Promise<Page<VendorBill>>;
  update(
    shopId: string,
    id: string,
    patch: { status?: VendorBillStatus; amountPaid?: number },
  ): Promise<VendorBill>;
}
