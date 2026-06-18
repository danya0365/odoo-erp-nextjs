import type { Role } from "@/src/domain/types/roles";

export interface Shop {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string; // ISO-8601
  updatedAt: string;
}

export interface User {
  id: string;
  shopId: string | null; // null = platform_admin
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** variant ที่พ่วง field ลับ — ใช้เฉพาะตอน verify, ห้ามหลุดออกนอก infra/use-case */
export interface UserWithSecret extends User {
  passwordHash: string;
}

export interface Session {
  id: string; // = token ใน cookie
  userId: string;
  expiresAt: string; // ISO-8601
  createdAt: string;
}

export type ProductType = "stockable" | "service" | "consumable";

export interface Product {
  id: string;
  shopId: string;
  sku: string;
  name: string;
  type: ProductType;
  salePrice: number; // minor units
  costPrice: number; // minor units
  taxRateBp: number; // basis points (700 = 7%)
  uom: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockLocation {
  id: string;
  shopId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockMoveType = "in" | "out" | "adjust";
export type StockSourceType = "adjustment" | "delivery" | "receipt";

export interface StockMove {
  id: string;
  shopId: string;
  productId: string;
  locationId: string;
  qtyDelta: number; // signed, scale QTY_SCALE
  type: StockMoveType;
  sourceType: StockSourceType;
  sourceId: string | null;
  note: string | null;
  createdAt: string;
}

export type SalesOrderStatus =
  | "draft"
  | "confirmed"
  | "partially_delivered"
  | "delivered"
  | "invoiced"
  | "done"
  | "cancelled";

export interface SalesOrder {
  id: string;
  shopId: string;
  docNumber: string | null; // ออกตอน confirm
  customerId: string;
  status: SalesOrderStatus;
  currency: string;
  untaxedAmount: number; // minor
  taxAmount: number;
  totalAmount: number;
  orderDate: string;
  confirmedAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderLine {
  id: string;
  shopId: string;
  salesOrderId: string;
  productId: string;
  description: string;
  qtyOrdered: number; // scale QTY_SCALE
  qtyDelivered: number;
  qtyInvoiced: number;
  unitPrice: number; // minor snapshot
  taxRateBp: number; // snapshot
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface SalesOrderWithLines extends SalesOrder {
  lines: SalesOrderLine[];
}

export type InvoiceStatus = "draft" | "posted" | "paid" | "cancelled";

export interface Invoice {
  id: string;
  shopId: string;
  docNumber: string;
  salesOrderId: string | null;
  customerId: string;
  status: InvoiceStatus;
  currency: string;
  untaxedAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLine {
  id: string;
  shopId: string;
  invoiceId: string;
  productId: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export type PurchaseOrderStatus =
  | "rfq"
  | "confirmed"
  | "partially_received"
  | "received"
  | "billed"
  | "done"
  | "cancelled";

export interface PurchaseOrder {
  id: string;
  shopId: string;
  docNumber: string | null;
  vendorId: string;
  status: PurchaseOrderStatus;
  currency: string;
  untaxedAmount: number;
  taxAmount: number;
  totalAmount: number;
  orderDate: string;
  confirmedAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLine {
  id: string;
  shopId: string;
  purchaseOrderId: string;
  productId: string;
  description: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyBilled: number;
  unitPrice: number; // minor (cost) snapshot
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface PurchaseOrderWithLines extends PurchaseOrder {
  lines: PurchaseOrderLine[];
}

export type VendorBillStatus = "draft" | "posted" | "paid" | "cancelled";

export interface VendorBill {
  id: string;
  shopId: string;
  docNumber: string;
  purchaseOrderId: string | null;
  vendorId: string;
  status: VendorBillStatus;
  currency: string;
  untaxedAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorBillLine {
  id: string;
  shopId: string;
  vendorBillId: string;
  productId: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export type PaymentDirection = "inbound" | "outbound";

export interface Payment {
  id: string;
  shopId: string;
  docNumber: string;
  partnerId: string;
  direction: PaymentDirection;
  invoiceId: string | null;
  vendorBillId: string | null;
  amount: number;
  method: string;
  paidAt: string;
  createdAt: string;
}

// ── Accounting (double-entry general ledger) ──
export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export interface Account {
  id: string;
  shopId: string;
  code: string;
  name: string;
  type: AccountType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type JournalType = "sale" | "purchase" | "bank" | "general";

export interface Journal {
  id: string;
  shopId: string;
  code: string;
  name: string;
  type: JournalType;
  createdAt: string;
  updatedAt: string;
}

export type JournalEntrySourceType = "invoice" | "bill" | "payment" | "manual";
export type JournalEntryStatus = "draft" | "posted";

export interface JournalEntry {
  id: string;
  shopId: string;
  docNumber: string;
  journalId: string;
  date: string; // ISO-8601
  ref: string | null; // เลขเอกสารต้นทาง เช่น INV00001
  sourceType: JournalEntrySourceType;
  sourceId: string | null;
  status: JournalEntryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  id: string;
  shopId: string;
  entryId: string;
  accountId: string;
  partnerId: string | null;
  label: string;
  debit: number; // minor units (≥ 0)
  credit: number; // minor units (≥ 0)
}

export interface JournalEntryWithLines extends JournalEntry {
  lines: JournalEntryLine[];
}

// ── CRM (sales pipeline) ──
export interface CrmStage {
  id: string;
  shopId: string;
  name: string;
  sequence: number; // ลำดับคอลัมน์ใน pipeline
  isWon: boolean; // ย้ายเข้าสเตจนี้ = ชนะ
  createdAt: string;
  updatedAt: string;
}

export type OpportunityStatus = "active" | "won" | "lost";

export interface Opportunity {
  id: string;
  shopId: string;
  name: string;
  partnerId: string | null; // ผูกผู้ติดต่อ (ถ้ามี)
  contactName: string | null;
  email: string | null;
  phone: string | null;
  expectedRevenue: number; // minor units
  probability: number; // 0–100
  stageId: string;
  status: OpportunityStatus;
  lostReason: string | null;
  salesOrderId: string | null; // ตั้งเมื่อแปลงเป็นใบเสนอราคา
  createdAt: string;
  updatedAt: string;
}

export type PartnerType = "customer" | "vendor" | "both";

export interface Partner {
  id: string;
  shopId: string;
  name: string;
  type: PartnerType;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  street: string | null;
  city: string | null;
  country: string | null;
  isCompany: boolean;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
