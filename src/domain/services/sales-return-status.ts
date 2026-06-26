// state machine ของใบคืนสินค้า/ใบลดหนี้ (pure) — guard ทุก transition
import type { SalesReturnStatus } from "@/src/domain/entities";
import { type TransitionGraph, canTransition } from "@/src/domain/services/document-status";

export const SALES_RETURN_GRAPH: TransitionGraph<SalesReturnStatus> = {
  draft: ["credited", "cancelled"],
  credited: ["refunded"],
  refunded: [],
  cancelled: [],
};

/** ยืนยันคืน = รับของกลับเข้าสต๊อก + ออกใบลดหนี้ (จาก draft เท่านั้น) */
export function canConfirm(status: SalesReturnStatus): boolean {
  return status === "draft";
}

/** คืนเงินได้เฉพาะใบที่ออกใบลดหนี้แล้ว */
export function canRefund(status: SalesReturnStatus): boolean {
  return status === "credited";
}

export function canCancel(status: SalesReturnStatus): boolean {
  return status === "draft";
}

export function assertReturnTransition(from: SalesReturnStatus, to: SalesReturnStatus): void {
  if (!canTransition(SALES_RETURN_GRAPH, from, to)) {
    throw new Error(`เปลี่ยนสถานะใบคืนไม่ได้: ${from} → ${to}`);
  }
}
