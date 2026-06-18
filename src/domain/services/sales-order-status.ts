// state machine ของ sales order (pure) — ใช้ guard ทุก transition
import type { SalesOrderStatus } from "@/src/domain/entities";
import { progressState, type LineProgress } from "@/src/domain/services/quantity";
import { type TransitionGraph, canTransition } from "@/src/domain/services/document-status";

export const SALES_ORDER_GRAPH: TransitionGraph<SalesOrderStatus> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["partially_delivered", "delivered", "cancelled"],
  partially_delivered: ["partially_delivered", "delivered"],
  delivered: ["invoiced"],
  invoiced: ["done"],
  done: [],
  cancelled: [],
};

export function canConfirm(status: SalesOrderStatus): boolean {
  return status === "draft";
}
export function canDeliver(status: SalesOrderStatus): boolean {
  return status === "confirmed" || status === "partially_delivered";
}
export function canInvoice(status: SalesOrderStatus): boolean {
  return status === "delivered";
}
export function canCancel(status: SalesOrderStatus): boolean {
  return status === "draft" || status === "confirmed";
}

/** สถานะหลังบันทึกการส่งของ จาก progress ของบรรทัด (delivered/partially_delivered) */
export function statusAfterDelivery(
  lines: ReadonlyArray<LineProgress>,
): Extract<SalesOrderStatus, "delivered" | "partially_delivered"> {
  return progressState(lines) === "full" ? "delivered" : "partially_delivered";
}

export function assertSalesTransition(
  from: SalesOrderStatus,
  to: SalesOrderStatus,
): void {
  if (!canTransition(SALES_ORDER_GRAPH, from, to)) {
    throw new Error(`เปลี่ยนสถานะใบขายไม่ได้: ${from} → ${to}`);
  }
}
