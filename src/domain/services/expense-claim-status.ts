// state machine ของใบเบิกค่าใช้จ่าย (pure)
import type { ExpenseClaimStatus } from "@/src/domain/entities";
import { type TransitionGraph, canTransition } from "@/src/domain/services/document-status";

export const EXPENSE_CLAIM_GRAPH: TransitionGraph<ExpenseClaimStatus> = {
  submitted: ["approved", "rejected"],
  approved: ["paid"],
  paid: [],
  rejected: [],
};

export function canApprove(status: ExpenseClaimStatus): boolean {
  return status === "submitted";
}
export function canReject(status: ExpenseClaimStatus): boolean {
  return status === "submitted";
}
export function canPay(status: ExpenseClaimStatus): boolean {
  return status === "approved";
}

export function assertExpenseTransition(from: ExpenseClaimStatus, to: ExpenseClaimStatus): void {
  if (!canTransition(EXPENSE_CLAIM_GRAPH, from, to)) {
    throw new Error(`เปลี่ยนสถานะใบเบิกไม่ได้: ${from} → ${to}`);
  }
}
