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
export type StockSourceType =
  | "adjustment"
  | "delivery"
  | "receipt"
  | "transfer"
  | "manufacturing"
  | "sales_return"
  | "stocktake"
  | "purchase_return";

export interface ReorderRule {
  id: string;
  shopId: string;
  productId: string;
  minQty: number; // scale QTY_SCALE — ถึงจุดนี้ให้เติม
  maxQty: number; // scale QTY_SCALE — เติมจนถึงระดับนี้
  createdAt: string;
  updatedAt: string;
}

export type StockCountStatus = "draft" | "applied" | "cancelled";

/** รอบตรวจนับสต๊อก (physical inventory) — นับจริงแล้วปรับยอดตามส่วนต่าง */
export interface StockCount {
  id: string;
  shopId: string;
  docNumber: string;
  status: StockCountStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockCountLine {
  id: string;
  shopId: string;
  stockCountId: string;
  productId: string;
  systemQty: number; // on-hand ณ เวลาที่เปิดรอบ (scale QTY_SCALE)
  countedQty: number; // นับได้จริง
}

export interface StockCountWithLines extends StockCount {
  lines: StockCountLine[];
}

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

export type SalesReturnStatus = "draft" | "credited" | "refunded" | "cancelled";

/** ใบคืนสินค้า/ใบลดหนี้ (credit note) — กลับด้านของใบแจ้งหนี้ */
export interface SalesReturn {
  id: string;
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
  refundedAmount: number;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalesReturnLine {
  id: string;
  shopId: string;
  salesReturnId: string;
  productId: string;
  description: string;
  qty: number; // scale QTY_SCALE
  unitPrice: number; // minor snapshot
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface SalesReturnWithLines extends SalesReturn {
  lines: SalesReturnLine[];
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

export type PurchaseReturnStatus = "draft" | "credited" | "cancelled";

/** ใบคืนของให้ผู้ขาย / ใบลดหนี้ผู้ขาย (vendor credit note) — กลับด้านใบตั้งหนี้ */
export interface PurchaseReturn {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseReturnLine {
  id: string;
  shopId: string;
  purchaseReturnId: string;
  productId: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface PurchaseReturnWithLines extends PurchaseReturn {
  lines: PurchaseReturnLine[];
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

/** บันทึกการยื่นภาษีมูลค่าเพิ่ม (ภพ.30) ต่องวดเดือน */
export interface VatFiling {
  id: string;
  shopId: string;
  periodStart: string; // "YYYY-MM"
  periodEnd: string; // "YYYY-MM-DD"
  outputVat: number;
  inputVat: number;
  netPayable: number;
  filedAt: string;
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

export type JournalEntrySourceType =
  | "invoice"
  | "bill"
  | "payment"
  | "manual"
  | "pos"
  | "payroll"
  | "credit_note"
  | "refund"
  | "vendor_credit"
  | "expense";
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

// ── POS (point of sale) ──
export type PosSessionStatus = "open" | "closed";

export interface PosSession {
  id: string;
  shopId: string;
  userId: string;
  status: PosSessionStatus;
  openingCash: number; // minor units — เงินทอนตั้งต้น
  closingCash: number | null; // minor — ยอดนับจริงตอนปิด
  expectedCash: number | null; // minor — ที่ควรมี (ตั้งต้น + ขายเงินสด)
  difference: number | null; // minor — นับจริง − ที่ควรมี
  openedAt: string;
  closedAt: string | null;
}

export type PosPaymentMethod = "cash" | "transfer";

export interface PosOrder {
  id: string;
  shopId: string;
  sessionId: string;
  docNumber: string;
  untaxedAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PosPaymentMethod;
  createdAt: string;
}

export interface PosOrderLine {
  id: string;
  shopId: string;
  posOrderId: string;
  productId: string;
  description: string;
  qty: number; // scale QTY_SCALE
  unitPrice: number; // minor snapshot
  taxRateBp: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface PosOrderWithLines extends PosOrder {
  lines: PosOrderLine[];
}

// ── Manufacturing (BOM + ใบสั่งผลิต) ──
export interface Bom {
  id: string;
  shopId: string;
  productId: string; // สินค้าสำเร็จรูปที่ผลิตได้
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BomLine {
  id: string;
  shopId: string;
  bomId: string;
  componentId: string; // วัตถุดิบ (product)
  qtyPerUnit: number; // scale QTY_SCALE — ใช้ต่อสินค้าสำเร็จรูป 1 หน่วย
}

export interface BomWithLines extends Bom {
  lines: BomLine[];
}

export type ManufacturingOrderStatus = "draft" | "confirmed" | "done" | "cancelled";

export interface ManufacturingOrder {
  id: string;
  shopId: string;
  docNumber: string | null; // ออกตอน confirm
  bomId: string;
  productId: string; // สินค้าสำเร็จรูป (snapshot จาก BOM)
  qty: number; // scale QTY_SCALE — จำนวนที่จะผลิต
  status: ManufacturingOrderStatus;
  createdAt: string;
  updatedAt: string;
}

// ── HR / Payroll ──
export interface Employee {
  id: string;
  shopId: string;
  name: string;
  position: string | null;
  baseSalary: number; // minor units (ต่อเดือน)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PayrollRunStatus = "draft" | "posted";

export interface PayrollRun {
  id: string;
  shopId: string;
  docNumber: string | null; // ออกตอน post
  period: string; // 'YYYY-MM'
  whtRateBp: number; // ภาษีหัก ณ ที่จ่าย (basis points)
  status: PayrollRunStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id: string;
  shopId: string;
  runId: string;
  employeeId: string;
  gross: number; // minor
  tax: number; // minor (หัก ณ ที่จ่าย)
  net: number; // minor
}

export interface PayrollRunWithSlips extends PayrollRun {
  slips: Payslip[];
}

// ── e-Commerce storefront ──
export interface OnlineOrder {
  id: string;
  shopId: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string | null;
  salesOrderId: string; // ใบขายที่สร้างเข้า pipeline
  totalAmount: number; // minor
  createdAt: string;
}

// ── Project / Timesheet ──
export type ProjectStatus = "active" | "closed";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Project {
  id: string;
  shopId: string;
  name: string;
  customerId: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  shopId: string;
  projectId: string;
  name: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Timesheet {
  id: string;
  shopId: string;
  projectId: string;
  taskId: string | null;
  employeeId: string;
  date: string; // ISO-8601 (วันที่ทำงาน)
  minutes: number; // นาที (integer)
  note: string | null;
  createdAt: string;
}

// ── Store reviews (รีวิวร้านบนหน้า public) ──
export interface StoreReview {
  id: string;
  shopId: string;
  customerName: string;
  rating: number; // 1–5
  comment: string | null;
  createdAt: string;
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
  creditTermDays: number | null;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseClaimStatus = "submitted" | "approved" | "paid" | "rejected";

/** ใบเบิกค่าใช้จ่ายพนักงาน */
export interface ExpenseClaim {
  id: string;
  shopId: string;
  docNumber: string;
  employeeId: string;
  category: string;
  description: string;
  amount: number; // minor units
  status: ExpenseClaimStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DunningLog {
  id: string;
  shopId: string;
  customerId: string;
  amount: number;
  note: string | null;
  sentAt: string;
  createdAt: string;
}
