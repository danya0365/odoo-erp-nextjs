// state machine ของ purchase order (pure) — mirror ของ sales (รับของแทนส่งของ)
import type { PurchaseOrderStatus } from "@/src/domain/entities";
import { progressState, type LineProgress } from "@/src/domain/services/quantity";
import { type TransitionGraph, canTransition } from "@/src/domain/services/document-status";

export const PURCHASE_ORDER_GRAPH: TransitionGraph<PurchaseOrderStatus> = {
  rfq: ["confirmed", "cancelled"],
  confirmed: ["partially_received", "received", "cancelled"],
  partially_received: ["partially_received", "received"],
  received: ["billed"],
  billed: ["done"],
  done: [],
  cancelled: [],
};

export function canConfirm(status: PurchaseOrderStatus): boolean {
  return status === "rfq";
}
export function canReceive(status: PurchaseOrderStatus): boolean {
  return status === "confirmed" || status === "partially_received";
}
export function canBill(status: PurchaseOrderStatus): boolean {
  return status === "received";
}
export function canCancel(status: PurchaseOrderStatus): boolean {
  return status === "rfq" || status === "confirmed";
}

export function statusAfterReceipt(
  lines: ReadonlyArray<LineProgress>,
): Extract<PurchaseOrderStatus, "received" | "partially_received"> {
  return progressState(lines) === "full" ? "received" : "partially_received";
}

export function assertPurchaseTransition(
  from: PurchaseOrderStatus,
  to: PurchaseOrderStatus,
): void {
  if (!canTransition(PURCHASE_ORDER_GRAPH, from, to)) {
    throw new Error(`เปลี่ยนสถานะใบสั่งซื้อไม่ได้: ${from} → ${to}`);
  }
}
