import "server-only";
import { and, eq, desc } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { AttendanceRecord, LeaveRequest } from "@/src/domain/entities";
import type {
  CreateAttendanceInput,
  IAttendanceRepository,
  CreateLeaveRequestInput,
  ILeaveRequestRepository,
} from "@/src/application/repositories/ITimeoffRepository";

function toAttendance(r: typeof schema.attendanceRecords.$inferSelect): AttendanceRecord {
  return { id: r.id, shopId: r.shopId, employeeId: r.employeeId, workDate: r.workDate, hoursWorked: r.hoursWorked, otHours: r.otHours, createdAt: r.createdAt };
}

function toLeave(r: typeof schema.leaveRequests.$inferSelect): LeaveRequest {
  return { id: r.id, shopId: r.shopId, employeeId: r.employeeId, leaveType: r.leaveType, days: r.days, reason: r.reason, status: r.status, createdAt: r.createdAt, updatedAt: r.updatedAt };
}

export class DrizzleAttendanceRepository implements IAttendanceRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateAttendanceInput): Promise<AttendanceRecord> {
    const [row] = await this.db.insert(schema.attendanceRecords).values(input).returning();
    return toAttendance(row);
  }

  async list(shopId: string): Promise<AttendanceRecord[]> {
    const rows = await this.db
      .select()
      .from(schema.attendanceRecords)
      .where(eq(schema.attendanceRecords.shopId, shopId))
      .orderBy(desc(schema.attendanceRecords.workDate));
    return rows.map(toAttendance);
  }
}

export class DrizzleLeaveRequestRepository implements ILeaveRequestRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateLeaveRequestInput): Promise<LeaveRequest> {
    const [row] = await this.db.insert(schema.leaveRequests).values(input).returning();
    return toLeave(row);
  }

  async findById(shopId: string, id: string): Promise<LeaveRequest | null> {
    const row = await this.db.query.leaveRequests.findFirst({
      where: and(eq(schema.leaveRequests.shopId, shopId), eq(schema.leaveRequests.id, id)),
    });
    return row ? toLeave(row) : null;
  }

  async list(shopId: string): Promise<LeaveRequest[]> {
    const rows = await this.db
      .select()
      .from(schema.leaveRequests)
      .where(eq(schema.leaveRequests.shopId, shopId))
      .orderBy(desc(schema.leaveRequests.createdAt));
    return rows.map(toLeave);
  }

  async update(shopId: string, id: string, patch: { status?: LeaveRequest["status"] }): Promise<LeaveRequest> {
    const [row] = await this.db
      .update(schema.leaveRequests)
      .set({ ...(patch.status !== undefined && { status: patch.status }) })
      .where(and(eq(schema.leaveRequests.shopId, shopId), eq(schema.leaveRequests.id, id)))
      .returning();
    return toLeave(row);
  }
}
