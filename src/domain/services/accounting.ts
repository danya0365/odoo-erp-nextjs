// บัญชีคู่ (double-entry) — pure ไม่มี I/O
// ทุกจำนวนเป็น integer "minor units" (สตางค์) เหมือน money.ts
// กฎหลัก: ทุก journal entry ต้องสมดุล (ผลรวมเดบิต = ผลรวมเครดิต)
import type {
  AccountType,
  JournalType,
  PaymentDirection,
} from "@/src/domain/entities";

// ── ผังบัญชีมาตรฐานต่อ shop (ออกครั้งเดียวตอน ensureDefaults) ──
export const ACCOUNT_CODES = {
  cash: "1000", // เงินสดและเงินฝากธนาคาร
  ar: "1100", // ลูกหนี้การค้า
  inputVat: "1300", // ภาษีซื้อ
  ap: "2100", // เจ้าหนี้การค้า
  outputVat: "2200", // ภาษีขาย
  whtPayable: "2300", // ภาษีหัก ณ ที่จ่ายค้างจ่าย
  equity: "3000", // ส่วนของเจ้าของ
  sales: "4000", // รายได้จากการขาย
  expense: "5000", // ต้นทุนและค่าใช้จ่าย
  salaryExpense: "5100", // เงินเดือนและค่าแรง
} as const;

export interface AccountDef {
  code: string;
  name: string;
  type: AccountType;
}

export const DEFAULT_ACCOUNTS: readonly AccountDef[] = [
  { code: ACCOUNT_CODES.cash, name: "เงินสดและเงินฝากธนาคาร", type: "asset" },
  { code: ACCOUNT_CODES.ar, name: "ลูกหนี้การค้า", type: "asset" },
  { code: ACCOUNT_CODES.inputVat, name: "ภาษีซื้อ", type: "asset" },
  { code: ACCOUNT_CODES.ap, name: "เจ้าหนี้การค้า", type: "liability" },
  { code: ACCOUNT_CODES.outputVat, name: "ภาษีขาย", type: "liability" },
  { code: ACCOUNT_CODES.whtPayable, name: "ภาษีหัก ณ ที่จ่ายค้างจ่าย", type: "liability" },
  { code: ACCOUNT_CODES.equity, name: "ส่วนของเจ้าของ", type: "equity" },
  { code: ACCOUNT_CODES.sales, name: "รายได้จากการขาย", type: "income" },
  { code: ACCOUNT_CODES.expense, name: "ต้นทุนและค่าใช้จ่าย", type: "expense" },
  { code: ACCOUNT_CODES.salaryExpense, name: "เงินเดือนและค่าแรง", type: "expense" },
];

export interface JournalDef {
  code: string;
  name: string;
  type: JournalType;
}

export const DEFAULT_JOURNALS: readonly JournalDef[] = [
  { code: "SAL", name: "สมุดรายวันขาย", type: "sale" },
  { code: "PUR", name: "สมุดรายวันซื้อ", type: "purchase" },
  { code: "BNK", name: "สมุดรายวันรับ-จ่ายเงิน", type: "bank" },
  { code: "GEN", name: "สมุดรายวันทั่วไป", type: "general" },
];

// ── ด้านปกติของบัญชี: asset/expense = เดบิต, อื่น ๆ = เครดิต ──
export function isDebitNormal(type: AccountType): boolean {
  return type === "asset" || type === "expense";
}

export interface BalanceSide {
  debit: number;
  credit: number;
}

export function totalsOf(lines: ReadonlyArray<BalanceSide>): BalanceSide {
  return lines.reduce(
    (acc, l) => ({ debit: acc.debit + l.debit, credit: acc.credit + l.credit }),
    { debit: 0, credit: 0 },
  );
}

/** สมดุลเมื่อ เดบิตรวม = เครดิตรวม และมากกว่า 0 (ไม่รับ entry ว่าง/ศูนย์) */
export function isBalanced(lines: ReadonlyArray<BalanceSide>): boolean {
  const { debit, credit } = totalsOf(lines);
  return debit === credit && debit > 0;
}

export function assertBalanced(lines: ReadonlyArray<BalanceSide>): void {
  if (!isBalanced(lines)) {
    throw new Error("รายการบัญชีไม่สมดุล (เดบิต ≠ เครดิต)");
  }
}

/** ยอดคงเหลือในด้านปกติของบัญชี (asset/expense = debit−credit, อื่น ๆ = credit−debit) */
export function signedBalance(
  type: AccountType,
  debit: number,
  credit: number,
): number {
  return isDebitNormal(type) ? debit - credit : credit - debit;
}

// ── เทมเพลตการลงบัญชี (Odoo-style) — คืน DraftLine ที่สมดุลเสมอ ──
export interface DraftLine {
  accountCode: string;
  label: string;
  debit: number;
  credit: number;
}

export interface DocAmounts {
  untaxed: number;
  tax: number;
  total: number;
}

const nonZero = (l: DraftLine) => l.debit !== 0 || l.credit !== 0;

/** ใบแจ้งหนี้ลูกค้า: DR ลูกหนี้ (รวม) / CR รายได้ (ก่อนภาษี) + CR ภาษีขาย */
export function invoiceEntryLines(a: DocAmounts): DraftLine[] {
  return [
    { accountCode: ACCOUNT_CODES.ar, label: "ลูกหนี้การค้า", debit: a.total, credit: 0 },
    { accountCode: ACCOUNT_CODES.sales, label: "รายได้จากการขาย", debit: 0, credit: a.untaxed },
    { accountCode: ACCOUNT_CODES.outputVat, label: "ภาษีขาย", debit: 0, credit: a.tax },
  ].filter(nonZero);
}

/** ใบตั้งหนี้ผู้ขาย: DR ค่าใช้จ่าย (ก่อนภาษี) + DR ภาษีซื้อ / CR เจ้าหนี้ (รวม) */
export function billEntryLines(a: DocAmounts): DraftLine[] {
  return [
    { accountCode: ACCOUNT_CODES.expense, label: "ต้นทุนและค่าใช้จ่าย", debit: a.untaxed, credit: 0 },
    { accountCode: ACCOUNT_CODES.inputVat, label: "ภาษีซื้อ", debit: a.tax, credit: 0 },
    { accountCode: ACCOUNT_CODES.ap, label: "เจ้าหนี้การค้า", debit: 0, credit: a.total },
  ].filter(nonZero);
}

/** ใบลดหนี้ (credit note) = กลับด้านใบแจ้งหนี้: DR รายได้ (ก่อนภาษี) + DR ภาษีขาย / CR ลูกหนี้ (รวม) */
export function creditNoteEntryLines(a: DocAmounts): DraftLine[] {
  return [
    { accountCode: ACCOUNT_CODES.sales, label: "กลับรายการรายได้ (คืนสินค้า)", debit: a.untaxed, credit: 0 },
    { accountCode: ACCOUNT_CODES.outputVat, label: "กลับภาษีขาย (คืนสินค้า)", debit: a.tax, credit: 0 },
    { accountCode: ACCOUNT_CODES.ar, label: "ลดลูกหนี้การค้า", debit: 0, credit: a.total },
  ].filter(nonZero);
}

/** คืนเงินลูกค้า: DR ลูกหนี้การค้า (ล้างยอดที่ค้างคืน) / CR เงินสด */
export function customerRefundEntryLines(amount: number): DraftLine[] {
  return [
    { accountCode: ACCOUNT_CODES.ar, label: "ล้างยอดคืนลูกค้า", debit: amount, credit: 0 },
    { accountCode: ACCOUNT_CODES.cash, label: "คืนเงินลูกค้า", debit: 0, credit: amount },
  ];
}

/** ขายสด (POS): DR เงินสด (รวม) / CR รายได้ (ก่อนภาษี) + CR ภาษีขาย — จ่ายทันที ไม่ผ่านลูกหนี้ */
export function cashSaleEntryLines(a: DocAmounts): DraftLine[] {
  return [
    { accountCode: ACCOUNT_CODES.cash, label: "รับเงินสดขายหน้าร้าน", debit: a.total, credit: 0 },
    { accountCode: ACCOUNT_CODES.sales, label: "รายได้จากการขาย", debit: 0, credit: a.untaxed },
    { accountCode: ACCOUNT_CODES.outputVat, label: "ภาษีขาย", debit: 0, credit: a.tax },
  ].filter(nonZero);
}

/** เงินเดือน: DR เงินเดือนและค่าแรง (gross) / CR เงินสด (สุทธิ) + CR ภาษีหัก ณ ที่จ่าย */
export function payrollEntryLines(amounts: { gross: number; tax: number; net: number }): DraftLine[] {
  return [
    { accountCode: ACCOUNT_CODES.salaryExpense, label: "เงินเดือนและค่าแรง", debit: amounts.gross, credit: 0 },
    { accountCode: ACCOUNT_CODES.cash, label: "จ่ายเงินเดือนสุทธิ", debit: 0, credit: amounts.net },
    { accountCode: ACCOUNT_CODES.whtPayable, label: "ภาษีหัก ณ ที่จ่าย", debit: 0, credit: amounts.tax },
  ].filter(nonZero);
}

/** การรับ-จ่ายเงิน: inbound = DR เงินสด / CR ลูกหนี้; outbound = DR เจ้าหนี้ / CR เงินสด */
export function paymentEntryLines(direction: PaymentDirection, amount: number): DraftLine[] {
  if (direction === "inbound") {
    return [
      { accountCode: ACCOUNT_CODES.cash, label: "รับชำระเงิน", debit: amount, credit: 0 },
      { accountCode: ACCOUNT_CODES.ar, label: "ตัดลูกหนี้การค้า", debit: 0, credit: amount },
    ];
  }
  return [
    { accountCode: ACCOUNT_CODES.ap, label: "ตัดเจ้าหนี้การค้า", debit: amount, credit: 0 },
    { accountCode: ACCOUNT_CODES.cash, label: "จ่ายชำระเงิน", debit: 0, credit: amount },
  ];
}

// ── สรุปงบทดลอง/กำไรขาดทุน จากแถวที่ aggregate มาแล้ว ──
export interface AccountSum {
  type: AccountType;
  debit: number;
  credit: number;
}

/** กำไรสุทธิ = รายได้รวม − ค่าใช้จ่ายรวม (จากยอดด้านปกติของแต่ละบัญชี) */
export function netProfit(rows: ReadonlyArray<AccountSum>): number {
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r.type === "income") income += signedBalance(r.type, r.debit, r.credit);
    else if (r.type === "expense") expense += signedBalance(r.type, r.debit, r.credit);
  }
  return income - expense;
}

export const journalTypeForSource: Record<
  Exclude<import("@/src/domain/entities").JournalEntrySourceType, "manual">,
  JournalType
> = {
  invoice: "sale",
  bill: "purchase",
  payment: "bank",
  pos: "sale",
  payroll: "general",
  credit_note: "sale",
  refund: "bank",
};
