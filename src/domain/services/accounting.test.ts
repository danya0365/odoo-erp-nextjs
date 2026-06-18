import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isBalanced,
  assertBalanced,
  isDebitNormal,
  signedBalance,
  totalsOf,
  invoiceEntryLines,
  billEntryLines,
  paymentEntryLines,
  cashSaleEntryLines,
  netProfit,
  DEFAULT_ACCOUNTS,
  ACCOUNT_CODES,
} from "./accounting";

test("isBalanced: เดบิต = เครดิต และ > 0", () => {
  assert.equal(isBalanced([{ debit: 100, credit: 0 }, { debit: 0, credit: 100 }]), true);
  assert.equal(isBalanced([{ debit: 100, credit: 0 }, { debit: 0, credit: 90 }]), false);
  assert.equal(isBalanced([{ debit: 0, credit: 0 }]), false); // entry ศูนย์ไม่ผ่าน
});

test("assertBalanced โยน error เมื่อไม่สมดุล", () => {
  assert.throws(() => assertBalanced([{ debit: 50, credit: 0 }]), /ไม่สมดุล/);
});

test("isDebitNormal: asset/expense = true", () => {
  assert.equal(isDebitNormal("asset"), true);
  assert.equal(isDebitNormal("expense"), true);
  assert.equal(isDebitNormal("liability"), false);
  assert.equal(isDebitNormal("income"), false);
  assert.equal(isDebitNormal("equity"), false);
});

test("signedBalance: ด้านปกติของบัญชี", () => {
  assert.equal(signedBalance("asset", 300, 100), 200); // debit-normal
  assert.equal(signedBalance("income", 0, 500), 500); // credit-normal
  assert.equal(signedBalance("liability", 20, 120), 100);
});

test("invoiceEntryLines สมดุล + ยอดถูก (107 = 100 + 7%)", () => {
  const lines = invoiceEntryLines({ untaxed: 10000, tax: 700, total: 10700 });
  assertBalanced(lines);
  const { debit, credit } = totalsOf(lines);
  assert.equal(debit, 10700);
  assert.equal(credit, 10700);
  const ar = lines.find((l) => l.accountCode === ACCOUNT_CODES.ar)!;
  assert.equal(ar.debit, 10700);
  const sales = lines.find((l) => l.accountCode === ACCOUNT_CODES.sales)!;
  assert.equal(sales.credit, 10000);
  const vat = lines.find((l) => l.accountCode === ACCOUNT_CODES.outputVat)!;
  assert.equal(vat.credit, 700);
});

test("invoiceEntryLines: ไม่มีภาษี → ตัดบรรทัดภาษีออก แต่ยังสมดุล", () => {
  const lines = invoiceEntryLines({ untaxed: 5000, tax: 0, total: 5000 });
  assert.equal(lines.length, 2);
  assertBalanced(lines);
  assert.equal(lines.some((l) => l.accountCode === ACCOUNT_CODES.outputVat), false);
});

test("billEntryLines สมดุล: DR ค่าใช้จ่าย+ภาษีซื้อ / CR เจ้าหนี้", () => {
  const lines = billEntryLines({ untaxed: 20000, tax: 1400, total: 21400 });
  assertBalanced(lines);
  const exp = lines.find((l) => l.accountCode === ACCOUNT_CODES.expense)!;
  assert.equal(exp.debit, 20000);
  const ap = lines.find((l) => l.accountCode === ACCOUNT_CODES.ap)!;
  assert.equal(ap.credit, 21400);
});

test("paymentEntryLines: inbound = DR เงินสด/CR ลูกหนี้", () => {
  const lines = paymentEntryLines("inbound", 10700);
  assertBalanced(lines);
  assert.equal(lines.find((l) => l.accountCode === ACCOUNT_CODES.cash)!.debit, 10700);
  assert.equal(lines.find((l) => l.accountCode === ACCOUNT_CODES.ar)!.credit, 10700);
});

test("paymentEntryLines: outbound = DR เจ้าหนี้/CR เงินสด", () => {
  const lines = paymentEntryLines("outbound", 21400);
  assertBalanced(lines);
  assert.equal(lines.find((l) => l.accountCode === ACCOUNT_CODES.ap)!.debit, 21400);
  assert.equal(lines.find((l) => l.accountCode === ACCOUNT_CODES.cash)!.credit, 21400);
});

test("cashSaleEntryLines: ขายสด DR เงินสด / CR รายได้+ภาษี (สมดุล)", () => {
  const lines = cashSaleEntryLines({ untaxed: 10000, tax: 700, total: 10700 });
  assertBalanced(lines);
  assert.equal(lines.find((l) => l.accountCode === ACCOUNT_CODES.cash)!.debit, 10700);
  assert.equal(lines.find((l) => l.accountCode === ACCOUNT_CODES.sales)!.credit, 10000);
  assert.equal(lines.find((l) => l.accountCode === ACCOUNT_CODES.outputVat)!.credit, 700);
  assert.equal(lines.some((l) => l.accountCode === ACCOUNT_CODES.ar), false); // ไม่ผ่านลูกหนี้
});

test("netProfit = รายได้ − ค่าใช้จ่าย", () => {
  const profit = netProfit([
    { type: "income", debit: 0, credit: 10000 },
    { type: "expense", debit: 6000, credit: 0 },
    { type: "asset", debit: 99999, credit: 0 }, // ไม่นับ
  ]);
  assert.equal(profit, 4000);
});

test("DEFAULT_ACCOUNTS: code ไม่ซ้ำ + ครบ 8 บัญชี", () => {
  const codes = DEFAULT_ACCOUNTS.map((a) => a.code);
  assert.equal(new Set(codes).size, codes.length);
  assert.equal(DEFAULT_ACCOUNTS.length, 8);
});
