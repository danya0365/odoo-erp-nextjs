// state machine ของใบสั่งผลิต (pure)
import type { ManufacturingOrderStatus } from "@/src/domain/entities";
import { type TransitionGraph, canTransition } from "@/src/domain/services/document-status";

export const MANUFACTURING_ORDER_GRAPH: TransitionGraph<ManufacturingOrderStatus> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

export function canConfirm(status: ManufacturingOrderStatus): boolean {
  return status === "draft";
}
export function canProduce(status: ManufacturingOrderStatus): boolean {
  return status === "confirmed";
}
export function canCancel(status: ManufacturingOrderStatus): boolean {
  return status === "draft" || status === "confirmed";
}

export function assertManufacturingTransition(
  from: ManufacturingOrderStatus,
  to: ManufacturingOrderStatus,
): void {
  if (!canTransition(MANUFACTURING_ORDER_GRAPH, from, to)) {
    throw new Error(`เปลี่ยนสถานะใบสั่งผลิตไม่ได้: ${from} → ${to}`);
  }
}
