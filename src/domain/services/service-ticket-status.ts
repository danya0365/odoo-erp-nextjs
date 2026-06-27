// state machine ของใบงานบริการ (pure)
import type { ServiceTicketStatus } from "@/src/domain/entities";
import { type TransitionGraph, canTransition } from "@/src/domain/services/document-status";

export const SERVICE_TICKET_GRAPH: TransitionGraph<ServiceTicketStatus> = {
  open: ["assigned", "cancelled"],
  assigned: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

export function canAssign(status: ServiceTicketStatus): boolean {
  return status === "open" || status === "assigned"; // มอบหมายซ้ำ/เปลี่ยนช่างได้
}
export function canClose(status: ServiceTicketStatus): boolean {
  return status === "assigned";
}
export function canCancel(status: ServiceTicketStatus): boolean {
  return status === "open" || status === "assigned";
}

export function assertServiceTransition(from: ServiceTicketStatus, to: ServiceTicketStatus): void {
  if (!canTransition(SERVICE_TICKET_GRAPH, from, to)) {
    throw new Error(`เปลี่ยนสถานะใบงานไม่ได้: ${from} → ${to}`);
  }
}
