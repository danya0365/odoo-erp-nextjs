import { test } from "node:test";
import assert from "node:assert/strict";

import type { AttendanceRecord, Employee, LeaveRequest } from "@/src/domain/entities";
import type { IEmployeeRepository } from "@/src/application/repositories/IEmployeeRepository";
import type { IAttendanceRepository, ILeaveRequestRepository } from "@/src/application/repositories/ITimeoffRepository";

import { LogAttendanceUseCase, CreateLeaveRequestUseCase, DecideLeaveRequestUseCase } from "./TimeoffUseCases";

const NOW = "2026-01-01T00:00:00.000Z";

class FakeEmployeeRepo implements IEmployeeRepository {
  emp: Employee = { id: "e1", shopId: "s1", name: "พนักงาน", position: null, baseSalary: 30000, isActive: true, createdAt: NOW, updatedAt: NOW };
  async create() { return this.emp; }
  async findById(_s: string, id: string) { return id === this.emp.id ? this.emp : null; }
  async list() { return [this.emp]; }
  async listActive() { return [this.emp]; }
  async setActive() { return this.emp; }
}

class FakeAttendanceRepo implements IAttendanceRepository {
  rows: AttendanceRecord[] = [];
  async create(input: { shopId: string; employeeId: string; workDate: string; hoursWorked: number; otHours: number }): Promise<AttendanceRecord> {
    const r: AttendanceRecord = { id: `a${this.rows.length + 1}`, createdAt: NOW, ...input };
    this.rows.push(r);
    return r;
  }
  async list() { return this.rows; }
}

class FakeLeaveRepo implements ILeaveRequestRepository {
  rows = new Map<string, LeaveRequest>();
  private seq = 0;
  async create(input: { shopId: string; employeeId: string; leaveType: LeaveRequest["leaveType"]; days: number; reason: string | null }): Promise<LeaveRequest> {
    const id = `l${++this.seq}`;
    const r: LeaveRequest = { id, status: "submitted", createdAt: NOW, updatedAt: NOW, ...input };
    this.rows.set(id, r);
    return r;
  }
  async findById(_s: string, id: string) { return this.rows.get(id) ?? null; }
  async list() { return [...this.rows.values()]; }
  async update(_s: string, id: string, patch: { status?: LeaveRequest["status"] }) {
    const r = this.rows.get(id)!;
    Object.assign(r, patch);
    return r;
  }
}

test("LogAttendance: บันทึกชั่วโมง + OT", async () => {
  const att = new FakeAttendanceRepo();
  const r = await new LogAttendanceUseCase(att, new FakeEmployeeRepo()).execute("s1", "e1", "2026-01-02", 800, 150);
  assert.equal(r.hoursWorked, 800);
  assert.equal(r.otHours, 150);
});

test("LogAttendance: ไม่ระบุชั่วโมงเลย → error", async () => {
  await assert.rejects(
    () => new LogAttendanceUseCase(new FakeAttendanceRepo(), new FakeEmployeeRepo()).execute("s1", "e1", "2026-01-02", 0, 0),
    /ชั่วโมง/,
  );
});

test("Leave: ยื่น → อนุมัติ; ปฏิเสธซ้ำไม่ได้", async () => {
  const leaves = new FakeLeaveRepo();
  const req = await new CreateLeaveRequestUseCase(leaves, new FakeEmployeeRepo()).execute("s1", "e1", "sick", 200, "ป่วย");
  assert.equal(req.status, "submitted");
  assert.equal(req.days, 200);
  const decide = new DecideLeaveRequestUseCase(leaves);
  const approved = await decide.execute("s1", req.id, "approved");
  assert.equal(approved.status, "approved");
  await assert.rejects(() => decide.execute("s1", req.id, "rejected"), /รออนุมัติ/);
});

test("Leave: จำนวนวัน ≤0 → error", async () => {
  await assert.rejects(
    () => new CreateLeaveRequestUseCase(new FakeLeaveRepo(), new FakeEmployeeRepo()).execute("s1", "e1", "personal", 0, null),
    /มากกว่า 0/,
  );
});
