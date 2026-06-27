import { test } from "node:test";
import assert from "node:assert/strict";

import type { Employee, Partner, ServiceTicket } from "@/src/domain/entities";
import type { IServiceTicketRepository } from "@/src/application/repositories/IServiceTicketRepository";
import type { IPartnerRepository } from "@/src/application/repositories/IPartnerRepository";
import type { IEmployeeRepository } from "@/src/application/repositories/IEmployeeRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

import { CreateServiceTicketUseCase, AssignServiceTicketUseCase, CloseServiceTicketUseCase } from "./ServiceTicketUseCases";

const NOW = "2026-01-01T00:00:00.000Z";

class FakeTicketRepo implements IServiceTicketRepository {
  tickets = new Map<string, ServiceTicket>();
  private seq = 0;
  async create(input: { shopId: string; docNumber: string; customerId: string; subject: string; description: string }): Promise<ServiceTicket> {
    const id = `t${++this.seq}`;
    const t: ServiceTicket = { id, status: "open", assigneeId: null, scheduledAt: null, createdAt: NOW, updatedAt: NOW, ...input };
    this.tickets.set(id, t);
    return t;
  }
  async findById(_s: string, id: string) { return this.tickets.get(id) ?? null; }
  async list() { return { items: [...this.tickets.values()], total: this.tickets.size, page: 1, pageSize: 20 }; }
  async update(_s: string, id: string, patch: { status?: ServiceTicket["status"]; assigneeId?: string | null; scheduledAt?: string | null }) {
    const t = this.tickets.get(id)!;
    Object.assign(t, patch);
    return t;
  }
}

class FakePartnerRepo implements IPartnerRepository {
  p: Partner = { id: "c1", shopId: "s1", name: "ลูกค้า", type: "customer", email: null, phone: null, taxId: null, street: null, city: null, country: null, isCompany: false, creditTermDays: null, parentId: null, isActive: true, createdAt: NOW, updatedAt: NOW };
  async create() { return this.p; }
  async findById(_s: string, id: string) { return id === this.p.id ? this.p : null; }
  async findByEmail() { return null; }
  async list() { return { items: [this.p], total: 1, page: 1, pageSize: 20 }; }
  async update() { return this.p; }
  async setActive() { return this.p; }
}

class FakeEmployeeRepo implements IEmployeeRepository {
  e: Employee = { id: "e1", shopId: "s1", name: "ช่าง", position: null, baseSalary: 0, isActive: true, createdAt: NOW, updatedAt: NOW };
  async create() { return this.e; }
  async findById(_s: string, id: string) { return id === this.e.id ? this.e : null; }
  async list() { return [this.e]; }
  async listActive() { return [this.e]; }
  async setActive() { return this.e; }
}

class FakeSeq implements ISequenceRepository {
  n = 0;
  async next() { return ++this.n; }
}

test("Create → Assign → Close (open → assigned → done)", async () => {
  const tickets = new FakeTicketRepo();
  const t = await new CreateServiceTicketUseCase(tickets, new FakePartnerRepo(), new FakeSeq()).execute("s1", "c1", "แอร์เสีย", "ไม่เย็น");
  assert.equal(t.status, "open");
  assert.equal(t.docNumber, "SVC00001");

  // ปิดก่อนมอบหมาย → error
  await assert.rejects(() => new CloseServiceTicketUseCase(tickets).execute("s1", t.id), /มอบหมายแล้ว/);

  const assigned = await new AssignServiceTicketUseCase(tickets, new FakeEmployeeRepo()).execute("s1", t.id, "e1", "2026-01-05T09:00");
  assert.equal(assigned.status, "assigned");
  assert.equal(assigned.assigneeId, "e1");

  const done = await new CloseServiceTicketUseCase(tickets).execute("s1", t.id);
  assert.equal(done.status, "done");
});

test("Create: เรื่องว่าง → error", async () => {
  await assert.rejects(
    () => new CreateServiceTicketUseCase(new FakeTicketRepo(), new FakePartnerRepo(), new FakeSeq()).execute("s1", "c1", "  ", ""),
    /ระบุเรื่อง/,
  );
});

test("Assign: ช่างไม่มีอยู่ → error", async () => {
  const tickets = new FakeTicketRepo();
  const t = await new CreateServiceTicketUseCase(tickets, new FakePartnerRepo(), new FakeSeq()).execute("s1", "c1", "x", "");
  await assert.rejects(
    () => new AssignServiceTicketUseCase(tickets, new FakeEmployeeRepo()).execute("s1", t.id, "nope", null),
    /ไม่พบช่าง/,
  );
});
