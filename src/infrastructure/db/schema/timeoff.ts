import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { employees } from "./hr";

export const LEAVE_TYPES = ["sick", "personal", "vacation"] as const;
export const LEAVE_STATUSES = ["submitted", "approved", "rejected"] as const;

export const attendanceRecords = sqliteTable(
  "attendance_records",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    employeeId: text()
      .notNull()
      .references(() => employees.id),
    workDate: text().notNull(),
    hoursWorked: integer({ mode: "number" }).notNull().default(0),
    otHours: integer({ mode: "number" }).notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("attendance_records_shop_emp_idx").on(t.shopId, t.employeeId)],
);

export const leaveRequests = sqliteTable(
  "leave_requests",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    employeeId: text()
      .notNull()
      .references(() => employees.id),
    leaveType: text({ enum: LEAVE_TYPES }).notNull().default("personal"),
    days: integer({ mode: "number" }).notNull().default(0),
    reason: text(),
    status: text({ enum: LEAVE_STATUSES }).notNull().default("submitted"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("leave_requests_shop_status_idx").on(t.shopId, t.status)],
);
