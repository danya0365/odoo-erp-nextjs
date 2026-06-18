import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  Account,
  Employee,
  Journal,
  PayrollRun,
  PayrollRunWithSlips,
} from "@/src/domain/entities";
import { DEFAULT_ACCOUNTS, DEFAULT_JOURNALS } from "@/src/domain/services/accounting";
import type {
  CreateEmployeeInput,
  IEmployeeRepository,
} from "@/src/application/repositories/IEmployeeRepository";
import type {
  CreatePayrollRunInput,
  IPayrollRunRepository,
  PayrollRunPatch,
} from "@/src/application/repositories/IPayrollRunRepository";
import type { IAccountRepository } from "@/src/application/repositories/IAccountRepository";
import type { IJournalRepository } from "@/src/application/repositories/IJournalRepository";
import type {
  CreateJournalEntryInput,
  IJournalEntryRepository,
} from "@/src/application/repositories/IJournalEntryRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";
import { CreateEmployeeUseCase } from "./CreateEmployeeUseCase";
import { GeneratePayrollRunUseCase } from "./GeneratePayrollRunUseCase";
import { PostPayrollRunUseCase } from "./PostPayrollRunUseCase";

const SHOP = "s1";
let counter = 0;
const uid = () => `id_${++counter}`;

class FakeEmployees implements IEmployeeRepository {
  store: Employee[] = [];
  async create(input: CreateEmployeeInput): Promise<Employee> {
    const e: Employee = {
      id: uid(), shopId: input.shopId, name: input.name, position: input.position ?? null,
      baseSalary: input.baseSalary, isActive: true, createdAt: "t", updatedAt: "t",
    };
    this.store.push(e);
    return e;
  }
  async findById(_s: string, id: string) { return this.store.find((e) => e.id === id) ?? null; }
  async list() { return [...this.store]; }
  async listActive() { return this.store.filter((e) => e.isActive); }
  async setActive(_s: string, id: string, isActive: boolean) {
    const e = this.store.find((x) => x.id === id)!;
    e.isActive = isActive;
    return e;
  }
}

class FakeRuns implements IPayrollRunRepository {
  store: PayrollRunWithSlips[] = [];
  async createWithSlips(input: CreatePayrollRunInput): Promise<PayrollRun> {
    const run: PayrollRunWithSlips = {
      id: uid(), shopId: input.shopId, docNumber: null, period: input.period, whtRateBp: input.whtRateBp,
      status: "draft", createdAt: "t", updatedAt: "t",
      slips: input.slips.map((s) => ({ id: uid(), shopId: input.shopId, runId: "", ...s })),
    };
    run.slips.forEach((s) => (s.runId = run.id));
    this.store.push(run);
    return run;
  }
  async findById(_s: string, id: string) { return this.store.find((r) => r.id === id) ?? null; }
  async list() { return [...this.store]; }
  async update(_s: string, id: string, patch: PayrollRunPatch) {
    const r = this.store.find((x) => x.id === id)!;
    Object.assign(r, patch);
    return r;
  }
}

class FakeSeq implements ISequenceRepository {
  private n = new Map<string, number>();
  async next(shopId: string, key: string) {
    const k = `${shopId}:${key}`;
    const v = (this.n.get(k) ?? 0) + 1;
    this.n.set(k, v);
    return v;
  }
}
class FakeAccounts implements IAccountRepository {
  private store: Account[] = [];
  async ensureDefaults(shopId: string): Promise<Account[]> {
    if (this.store.length === 0)
      this.store = DEFAULT_ACCOUNTS.map((a) => ({ id: uid(), shopId, code: a.code, name: a.name, type: a.type, isActive: true, createdAt: "t", updatedAt: "t" }));
    return [...this.store];
  }
  async list() { return [...this.store]; }
  async findByCode(_s: string, code: string) { return this.store.find((a) => a.code === code) ?? null; }
  async codeMap() { return new Map(this.store.map((a) => [a.code, a])); }
  async create(): Promise<Account> { return this.store[0]; }
}
class FakeJournals implements IJournalRepository {
  private store: Journal[] = [];
  async ensureDefaults(shopId: string): Promise<Journal[]> {
    if (this.store.length === 0)
      this.store = DEFAULT_JOURNALS.map((j) => ({ id: uid(), shopId, code: j.code, name: j.name, type: j.type, createdAt: "t", updatedAt: "t" }));
    return [...this.store];
  }
  async list() { return [...this.store]; }
  async findByType(_s: string, type: Journal["type"]) { return this.store.find((j) => j.type === type) ?? null; }
}
class FakeEntries implements Partial<IJournalEntryRepository> {
  entries: (CreateJournalEntryInput & { id: string })[] = [];
  async findBySource(shopId: string, sourceType: string, sourceId: string) {
    const e = this.entries.find((x) => x.shopId === shopId && x.sourceType === sourceType && x.sourceId === sourceId);
    return e ? ({ ...e, ref: e.ref ?? null, sourceId: e.sourceId ?? null, createdAt: "t", updatedAt: "t" } as never) : null;
  }
  async createWithLines(input: CreateJournalEntryInput) {
    const e = { ...input, id: uid() };
    this.entries.push(e);
    return { ...input, id: e.id, ref: input.ref ?? null, sourceId: input.sourceId ?? null, createdAt: "t", updatedAt: "t" };
  }
}
function postDeps() {
  return { accounts: new FakeAccounts(), journals: new FakeJournals(), entries: new FakeEntries() as IJournalEntryRepository, sequences: new FakeSeq() };
}

test("CreateEmployee: ชื่อว่าง → error", async () => {
  await assert.rejects(() => new CreateEmployeeUseCase(new FakeEmployees()).execute(SHOP, " ", null, 0), /ระบุชื่อ/);
});

test("Generate: ไม่มีพนักงาน → error", async () => {
  await assert.rejects(
    () => new GeneratePayrollRunUseCase(new FakeEmployees(), new FakeRuns()).execute(SHOP, "2026-06", 300),
    /ยังไม่มีพนักงาน/,
  );
});

test("Generate: ออกสลิปทุกคน + คำนวณภาษี 3%", async () => {
  const emps = new FakeEmployees();
  await new CreateEmployeeUseCase(emps).execute(SHOP, "A", "dev", 3000000); // 30,000
  await new CreateEmployeeUseCase(emps).execute(SHOP, "B", "ops", 2000000); // 20,000
  const runs = new FakeRuns();
  const run = await new GeneratePayrollRunUseCase(emps, runs).execute(SHOP, "2026-06", 300);
  const full = await runs.findById(SHOP, run.id);
  assert.equal(full!.slips.length, 2);
  assert.equal(full!.slips[0].tax, 90000); // 3% ของ 30,000
  assert.equal(full!.slips[0].net, 2910000);
});

test("Post: ลงบัญชีสมดุล (DR เงินเดือน / CR เงินสด+ภาษี) + เลข PR + idempotent", async () => {
  const emps = new FakeEmployees();
  await new CreateEmployeeUseCase(emps).execute(SHOP, "A", null, 3000000);
  const runs = new FakeRuns();
  const run = await new GeneratePayrollRunUseCase(emps, runs).execute(SHOP, "2026-06", 300);
  const deps = postDeps();

  const posted = await new PostPayrollRunUseCase(runs, deps.sequences, deps).execute(SHOP, run.id, "t");
  assert.equal(posted.docNumber, "PR00001");
  assert.equal(posted.status, "posted");

  const entries = (deps.entries as unknown as FakeEntries).entries;
  assert.equal(entries.length, 1);
  const lines = entries[0].lines;
  const debit = lines.reduce((s, l) => s + l.debit, 0);
  const credit = lines.reduce((s, l) => s + l.credit, 0);
  assert.equal(debit, credit);
  assert.equal(debit, 3000000); // gross

  // โพสต์ซ้ำไม่ได้
  await assert.rejects(() => new PostPayrollRunUseCase(runs, deps.sequences, deps).execute(SHOP, run.id, "t"), /อนุมัติแล้ว/);
});
