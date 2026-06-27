import type { AttendanceRecord, LeaveRequest, LeaveType } from "@/src/domain/entities";
import type { IEmployeeRepository } from "@/src/application/repositories/IEmployeeRepository";
import type {
  IAttendanceRepository,
  ILeaveRequestRepository,
} from "@/src/application/repositories/ITimeoffRepository";

/** ลงเวลาทำงาน/OT */
export class LogAttendanceUseCase {
  constructor(
    private readonly attendance: IAttendanceRepository,
    private readonly employees: IEmployeeRepository,
  ) {}
  async execute(shopId: string, employeeId: string, workDate: string, hoursWorked: number, otHours: number): Promise<AttendanceRecord> {
    const emp = await this.employees.findById(shopId, employeeId);
    if (!emp) throw new Error("ไม่พบพนักงาน");
    if (hoursWorked <= 0 && otHours <= 0) throw new Error("ต้องระบุชั่วโมงทำงานหรือ OT");
    return this.attendance.create({ shopId, employeeId, workDate, hoursWorked, otHours });
  }
}

/** ยื่นขอลา */
export class CreateLeaveRequestUseCase {
  constructor(
    private readonly leaves: ILeaveRequestRepository,
    private readonly employees: IEmployeeRepository,
  ) {}
  async execute(shopId: string, employeeId: string, leaveType: LeaveType, days: number, reason: string | null): Promise<LeaveRequest> {
    const emp = await this.employees.findById(shopId, employeeId);
    if (!emp) throw new Error("ไม่พบพนักงาน");
    if (days <= 0) throw new Error("จำนวนวันลาต้องมากกว่า 0");
    return this.leaves.create({ shopId, employeeId, leaveType, days, reason });
  }
}

/** อนุมัติ/ปฏิเสธ คำขอลา (จาก submitted เท่านั้น) */
export class DecideLeaveRequestUseCase {
  constructor(private readonly leaves: ILeaveRequestRepository) {}
  async execute(shopId: string, id: string, decision: "approved" | "rejected"): Promise<LeaveRequest> {
    const leave = await this.leaves.findById(shopId, id);
    if (!leave) throw new Error("ไม่พบคำขอลา");
    if (leave.status !== "submitted") throw new Error("ตัดสินได้เฉพาะคำขอที่รออนุมัติ");
    return this.leaves.update(shopId, id, { status: decision });
  }
}
