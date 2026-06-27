import { test } from "node:test";
import assert from "node:assert/strict";

import type { Employee, ExpenseClaim } from "@/src/domain/entities";
import type { IExpenseClaimRepository } from "@/src/application/repositories/IExpenseClaimRepository";
import type { IEmployeeRepository } from "@/src/application/repositories/IEmployeeRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

import { CreateExpenseClaimUseCase } from "./CreateExpenseClaimUseCase";
import {
  ApproveExpenseClaimUseCase,
  RejectExpenseClaimUseCase,
  PayExpenseClaimUseCase,
} from "./TransitionExpenseClaimUseCase";

const NOW = "2026-01-01T00:00:00.000Z";

class FakeClaimRepo implements IExpenseClaimRepository {
  claims = new Map<string, ExpenseClaim>();
  private seq = 0;
  async create(input: { shopId: string; docNumber: string; employeeId: string; category: string; description: string; amount: number }): Promise<ExpenseClaim> {
    const id = `exp${++this.seq}`;
    const c: ExpenseClaim = { id, status: "submitted", paidAt: null, createdAt: NOW, updatedAt: NOW, ...input };
    this.claims.set(id, c);
    return c;
  }
  async findById(_shopId: string, id: string) {
    return this.claims.get(id) ?? null;
  }
  async list() {
    return { items: [...this.claims.values()], total: this.claims.size, page: 1, pageSize: 20 };
  }
  async update(_shopId: string, id: string, patch: { status?: ExpenseClaim["status"]; paidAt?: string | null }): Promise<ExpenseClaim> {
    const c = this.claims.get(id)!;
    Object.assign(c, patch);
    return c;
  }
}

class FakeEmployeeRepo implements IEmployeeRepository {
  emp: Employee = { id: "e1", shopId: "s1", name: "พนักงาน", position: null, baseSalary: 30000, isActive: true, createdAt: NOW, updatedAt: NOW };
  async create() { return this.emp; }
  async findById(_shopId: string, id: string) { return id === this.emp.id ? this.emp : null; }
  async list() { return [this.emp]; }
  async listActive() { return [this.emp]; }
  async setActive() { return this.emp; }
}

class FakeSequenceRepo implements ISequenceRepository {
  counters = new Map<string, number>();
  async next(shopId: string, key: string) {
    const k = `${shopId}:${key}`;
    const v = (this.counters.get(k) ?? 0) + 1;
    this.counters.set(k, v);
    return v;
  }
}

function deps() {
  return { claims: new FakeClaimRepo(), employees: new FakeEmployeeRepo(), seq: new FakeSequenceRepo() };
}

test("Create: ยื่นเบิก → submitted + docNumber EXP", async () => {
  const d = deps();
  const c = await new CreateExpenseClaimUseCase(d.claims, d.employees, d.seq).execute("s1", {
    employeeId: "e1", category: "เดินทาง", description: "แท็กซี่", amount: 25000,
  });
  assert.equal(c.status, "submitted");
  assert.equal(c.docNumber, "EXP00001");
  assert.equal(c.amount, 25000);
});

test("Create: จำนวนเงิน ≤0 → error", async () => {
  const d = deps();
  await assert.rejects(
    () => new CreateExpenseClaimUseCase(d.claims, d.employees, d.seq).execute("s1", { employeeId: "e1", category: "x", description: "", amount: 0 }),
    /มากกว่า 0/,
  );
});

test("flow: submitted → approved → paid", async () => {
  const d = deps();
  const c = await new CreateExpenseClaimUseCase(d.claims, d.employees, d.seq).execute("s1", { employeeId: "e1", category: "x", description: "", amount: 1000 });
  // จ่ายก่อนอนุมัติ → error
  await assert.rejects(() => new PayExpenseClaimUseCase(d.claims).execute("s1", c.id, NOW), /อนุมัติแล้ว/);
  const approved = await new ApproveExpenseClaimUseCase(d.claims).execute("s1", c.id);
  assert.equal(approved.status, "approved");
  const paid = await new PayExpenseClaimUseCase(d.claims).execute("s1", c.id, NOW);
  assert.equal(paid.status, "paid");
  assert.equal(paid.paidAt, NOW);
});

test("reject: เฉพาะ submitted", async () => {
  const d = deps();
  const c = await new CreateExpenseClaimUseCase(d.claims, d.employees, d.seq).execute("s1", { employeeId: "e1", category: "x", description: "", amount: 1000 });
  const rejected = await new RejectExpenseClaimUseCase(d.claims).execute("s1", c.id);
  assert.equal(rejected.status, "rejected");
  await assert.rejects(() => new ApproveExpenseClaimUseCase(d.claims).execute("s1", c.id), /รออนุมัติ/);
});
