// state machine ของใบคืนของผู้ขาย/ใบลดหนี้ผู้ขาย (pure)
import type { PurchaseReturnStatus } from "@/src/domain/entities";
import { type TransitionGraph, canTransition } from "@/src/domain/services/document-status";

export const PURCHASE_RETURN_GRAPH: TransitionGraph<PurchaseReturnStatus> = {
  draft: ["credited", "cancelled"],
  credited: [],
  cancelled: [],
};

/** ยืนยันคืน = ส่งของกลับผู้ขาย (stock OUT) + ออกใบลดหนี้ผู้ขาย (จาก draft) */
export function canConfirm(status: PurchaseReturnStatus): boolean {
  return status === "draft";
}

export function canCancel(status: PurchaseReturnStatus): boolean {
  return status === "draft";
}

export function assertPurchaseReturnTransition(from: PurchaseReturnStatus, to: PurchaseReturnStatus): void {
  if (!canTransition(PURCHASE_RETURN_GRAPH, from, to)) {
    throw new Error(`เปลี่ยนสถานะใบคืนผู้ขายไม่ได้: ${from} → ${to}`);
  }
}
