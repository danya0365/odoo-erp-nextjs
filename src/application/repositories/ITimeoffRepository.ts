import type { AttendanceRecord, LeaveRequest, LeaveType, LeaveStatus } from "@/src/domain/entities";

export interface CreateAttendanceInput {
  shopId: string;
  employeeId: string;
  workDate: string;
  hoursWorked: number;
  otHours: number;
}

export interface IAttendanceRepository {
  create(input: CreateAttendanceInput): Promise<AttendanceRecord>;
  list(shopId: string): Promise<AttendanceRecord[]>;
}

export interface CreateLeaveRequestInput {
  shopId: string;
  employeeId: string;
  leaveType: LeaveType;
  days: number;
  reason: string | null;
}

export interface ILeaveRequestRepository {
  create(input: CreateLeaveRequestInput): Promise<LeaveRequest>;
  findById(shopId: string, id: string): Promise<LeaveRequest | null>;
  list(shopId: string): Promise<LeaveRequest[]>;
  update(shopId: string, id: string, patch: { status?: LeaveStatus }): Promise<LeaveRequest>;
}
