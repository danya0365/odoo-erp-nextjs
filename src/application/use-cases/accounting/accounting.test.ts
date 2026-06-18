import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  Account,
  Invoice,
  Journal,
  JournalEntry,
  JournalEntryWithLines,
  Payment,
  VendorBill,
} from "@/src/domain/entities";
import { DEFAULT_ACCOUNTS, DEFAULT_JOURNALS, ACCOUNT_CODES } from "@/src/domain/services/accounting";
import type { IAccountRepository } from "@/src/application/repositories/IAccountRepository";
import type { IJournalRepository } from "@/src/application/repositories/IJournalRepository";
import type {
  CreateJournalEntryInput,
  IJournalEntryRepository,
  TrialBalanceRow,
} from "@/src/application/repositories/IJournalEntryRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";
import { PostInvoiceJournalEntryUseCase } from "./PostInvoiceJournalEntryUseCase";
import { PostVendorBillJournalEntryUseCase } from "./PostVendorBillJournalEntryUseCase";
import { PostPaymentJournalEntryUseCase } from "./PostPaymentJournalEntryUseCase";
import { CreateManualJournalEntryUseCase } from "./CreateManualJournalEntryUseCase";
import { GetTrialBalanceUseCase } from "./GetTrialBalanceUseCase";
import { GetGeneralLedgerUseCase } from "./GetGeneralLedgerUseCase";

let counter = 0;
const uid = () => `id_${++counter}`;

class FakeAccounts implements IAccountRepository {
  private store: Account[] = [];
  constructor(private readonly shopId: string) {}
  async ensureDefaults(shopId: string): Promise<Account[]> {
    if (this.store.length === 0) {
      this.store = DEFAULT_ACCOUNTS.map((a) => ({
        id: uid(), shopId, code: a.code, name: a.name, type: a.type,
        isActive: true, createdAt: "t", updatedAt: "t",
      }));
    }
    return this.list(shopId);
  }
  async list(): Promise<Account[]> {
    return [...this.store];
  }
  async findByCode(_shopId: string, code: string): Promise<Account | null> {
    return this.store.find((a) => a.code === code) ?? null;
  }
  async codeMap(): Promise<Map<string, Account>> {
    return new Map(this.store.map((a) => [a.code, a]));
  }
  async create(input: { shopId: string; code: string; name: string; type: Account["type"] }): Promise<Account> {
    const a: Account = { id: uid(), ...input, isActive: true, createdAt: "t", updatedAt: "t" };
    this.store.push(a);
    return a;
  }
}

class FakeJournals implements IJournalRepository {
  private store: Journal[] = [];
  async ensureDefaults(shopId: string): Promise<Journal[]> {
    if (this.store.length === 0) {
      this.store = DEFAULT_JOURNALS.map((j) => ({
        id: uid(), shopId, code: j.code, name: j.name, type: j.type, createdAt: "t", updatedAt: "t",
      }));
    }
    return [...this.store];
  }
  async list(): Promise<Journal[]> {
    return [...this.store];
  }
  async findByType(_s: string, type: Journal["type"]): Promise<Journal | null> {
    return this.store.find((j) => j.type === type) ?? null;
  }
}

class FakeEntries implements IJournalEntryRepository {
  entries: JournalEntryWithLines[] = [];
  constructor(private readonly accounts?: FakeAccounts) {}
  async createWithLines(input: CreateJournalEntryInput): Promise<JournalEntry> {
    const entry: JournalEntryWithLines = {
      id: uid(), shopId: input.shopId, docNumber: input.docNumber, journalId: input.journalId,
      date: input.date, ref: input.ref ?? null, sourceType: input.sourceType,
      sourceId: input.sourceId ?? null, status: input.status, createdAt: "t", updatedAt: "t",
      lines: input.lines.map((l) => ({
        id: uid(), shopId: input.shopId, entryId: "", accountId: l.accountId,
        partnerId: l.partnerId ?? null, label: l.label, debit: l.debit, credit: l.credit,
      })),
    };
    entry.lines.forEach((l) => (l.entryId = entry.id));
    this.entries.push(entry);
    return entry;
  }
  async findById(shopId: string, id: string): Promise<JournalEntryWithLines | null> {
    return this.entries.find((e) => e.shopId === shopId && e.id === id) ?? null;
  }
  async findBySource(shopId: string, sourceType: string, sourceId: string): Promise<JournalEntry | null> {
    return this.entries.find((e) => e.shopId === shopId && e.sourceType === sourceType && e.sourceId === sourceId) ?? null;
  }
  async list(shopId: string, query: PageQuery): Promise<Page<JournalEntry>> {
    const items = this.entries.filter((e) => e.shopId === shopId);
    return { items, total: items.length, page: query.page, pageSize: query.pageSize };
  }
  async trialBalance(shopId: string): Promise<TrialBalanceRow[]> {
    const accs = this.accounts ? await this.accounts.list() : [];
    const byId = new Map(accs.map((a) => [a.id, a]));
    const byAccount = new Map<string, TrialBalanceRow>();
    for (const e of this.entries) {
      if (e.shopId !== shopId || e.status !== "posted") continue;
      for (const l of e.lines) {
        const acc = byId.get(l.accountId);
        const row = byAccount.get(l.accountId) ?? {
          accountId: l.accountId, code: acc?.code ?? "?", name: acc?.name ?? "?",
          type: acc?.type ?? ("asset" as const), debit: 0, credit: 0,
        };
        row.debit += l.debit;
        row.credit += l.credit;
        byAccount.set(l.accountId, row);
      }
    }
    return [...byAccount.values()];
  }
  async ledger(shopId: string, accountId: string) {
    const out = [];
    for (const e of this.entries) {
      if (e.shopId !== shopId || e.status !== "posted") continue;
      for (const l of e.lines) {
        if (l.accountId !== accountId) continue;
        out.push({ entryId: e.id, docNumber: e.docNumber, date: e.date, ref: e.ref, label: l.label, debit: l.debit, credit: l.credit });
      }
    }
    return out;
  }
}

class FakeSequences implements ISequenceRepository {
  private n = new Map<string, number>();
  async next(shopId: string, key: string): Promise<number> {
    const k = `${shopId}:${key}`;
    const v = (this.n.get(k) ?? 0) + 1;
    this.n.set(k, v);
    return v;
  }
}

const SHOP = "shop1";
function deps() {
  const accounts = new FakeAccounts(SHOP);
  return {
    accounts,
    journals: new FakeJournals(),
    entries: new FakeEntries(accounts),
    sequences: new FakeSequences(),
  };
}

const invoice: Invoice = {
  id: "inv1", shopId: SHOP, docNumber: "INV00001", salesOrderId: "so1", customerId: "cust1",
  status: "posted", currency: "THB", untaxedAmount: 10000, taxAmount: 700, totalAmount: 10700,
  amountPaid: 0, dueDate: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "t",
};

test("PostInvoice: สร้าง entry สมดุล + ผูก sale journal + JE sequence", async () => {
  const d = deps();
  const entry = await new PostInvoiceJournalEntryUseCase(d).execute(invoice);
  assert.equal(entry.docNumber, "JE00001");
  assert.equal(entry.sourceType, "invoice");
  const full = await d.entries.findById(SHOP, entry.id);
  const debit = full!.lines.reduce((s, l) => s + l.debit, 0);
  const credit = full!.lines.reduce((s, l) => s + l.credit, 0);
  assert.equal(debit, 10700);
  assert.equal(credit, 10700);
  const saleJournal = (await d.journals.findByType(SHOP, "sale"))!;
  assert.equal(entry.journalId, saleJournal.id);
});

test("PostInvoice: idempotent — ลงซ้ำคืน entry เดิม ไม่สร้างใหม่", async () => {
  const d = deps();
  const first = await new PostInvoiceJournalEntryUseCase(d).execute(invoice);
  const second = await new PostInvoiceJournalEntryUseCase(d).execute(invoice);
  assert.equal(first.id, second.id);
  assert.equal(d.entries.entries.length, 1);
});

test("PostVendorBill + PostPayment(outbound): สมดุลและถูกสมุดรายวัน", async () => {
  const d = deps();
  const bill: VendorBill = {
    id: "bill1", shopId: SHOP, docNumber: "BILL00001", purchaseOrderId: "po1", vendorId: "ven1",
    status: "posted", currency: "THB", untaxedAmount: 20000, taxAmount: 1400, totalAmount: 21400,
    amountPaid: 0, dueDate: null, createdAt: "t", updatedAt: "t",
  };
  const be = await new PostVendorBillJournalEntryUseCase(d).execute(bill);
  assert.equal(be.journalId, (await d.journals.findByType(SHOP, "purchase"))!.id);

  const payment: Payment = {
    id: "pay1", shopId: SHOP, docNumber: "PAY00001", partnerId: "ven1", direction: "outbound",
    invoiceId: null, vendorBillId: "bill1", amount: 21400, method: "cash", paidAt: "t", createdAt: "t",
  };
  const pe = await new PostPaymentJournalEntryUseCase(d).execute(payment);
  assert.equal(pe.journalId, (await d.journals.findByType(SHOP, "bank"))!.id);
  const full = await d.entries.findById(SHOP, pe.id);
  assert.equal(full!.lines.find((l) => l.debit > 0)!.debit, 21400); // DR เจ้าหนี้
});

test("ManualEntry: ปฏิเสธรายการที่ไม่สมดุล", async () => {
  const d = deps();
  await assert.rejects(
    () => new CreateManualJournalEntryUseCase(d.journals, d.entries, d.sequences).execute({
      shopId: SHOP, date: "t",
      lines: [
        { accountId: "a", label: "x", debit: 100, credit: 0 },
        { accountId: "b", label: "y", debit: 0, credit: 90 },
      ],
    }),
    /ไม่สมดุล/,
  );
});

test("TrialBalance: เดบิตรวม = เครดิตรวม หลังลง invoice + payment", async () => {
  const d = deps();
  await new PostInvoiceJournalEntryUseCase(d).execute(invoice);
  const payment: Payment = {
    id: "pay2", shopId: SHOP, docNumber: "PAY00002", partnerId: "cust1", direction: "inbound",
    invoiceId: "inv1", vendorBillId: null, amount: 10700, method: "cash", paidAt: "t", createdAt: "t",
  };
  await new PostPaymentJournalEntryUseCase(d).execute(payment);
  const tb = await new GetTrialBalanceUseCase(d.accounts, d.entries).execute(SHOP);
  assert.equal(tb.totals.debit, tb.totals.credit);
  assert.equal(tb.totals.debit, 21400); // 10700 (invoice) + 10700 (payment)
  assert.equal(tb.netProfit, 10000); // รายได้ 10000, ไม่มีค่าใช้จ่าย
});

test("GeneralLedger: ยอดสะสมลูกหนี้ = 0 หลังออกบิลแล้วรับชำระครบ", async () => {
  const d = deps();
  await new PostInvoiceJournalEntryUseCase(d).execute(invoice); // DR AR 10700
  const payment: Payment = {
    id: "pay3", shopId: SHOP, docNumber: "PAY00003", partnerId: "cust1", direction: "inbound",
    invoiceId: "inv1", vendorBillId: null, amount: 10700, method: "cash", paidAt: "t", createdAt: "t",
  };
  await new PostPaymentJournalEntryUseCase(d).execute(payment); // CR AR 10700
  const ar = (await d.accounts.findByCode(SHOP, ACCOUNT_CODES.ar))!;
  const led = await new GetGeneralLedgerUseCase(d.entries).execute(SHOP, ar.id);
  assert.equal(led.rows.at(-1)!.balance, 0);
  assert.equal(led.totals.debit, 10700);
  assert.equal(led.totals.credit, 10700);
});
