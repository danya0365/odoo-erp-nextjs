// สถานะ + การคำนวณของ CRM pipeline (pure)
import type { OpportunityStatus } from "@/src/domain/entities";
import { roundHalfUp } from "@/src/domain/services/money";
import { type TransitionGraph, canTransition } from "@/src/domain/services/document-status";

export interface StageDef {
  name: string;
  sequence: number;
  isWon: boolean;
}

/** pipeline มาตรฐาน (สร้างครั้งเดียวต่อ shop) — ปิดการขายอยู่สเตจสุดท้าย */
export const DEFAULT_CRM_STAGES: readonly StageDef[] = [
  { name: "ผู้สนใจใหม่", sequence: 10, isWon: false },
  { name: "ผ่านการคัดกรอง", sequence: 20, isWon: false },
  { name: "เสนอราคา", sequence: 30, isWon: false },
  { name: "ปิดการขาย", sequence: 40, isWon: true },
];

export const OPPORTUNITY_GRAPH: TransitionGraph<OpportunityStatus> = {
  active: ["won", "lost"],
  won: ["active"], // เปิดใหม่
  lost: ["active"], // เปิดใหม่
};

export function canMarkWon(status: OpportunityStatus): boolean {
  return canTransition(OPPORTUNITY_GRAPH, status, "won");
}

export function canMarkLost(status: OpportunityStatus): boolean {
  return canTransition(OPPORTUNITY_GRAPH, status, "lost");
}

export function canReopen(status: OpportunityStatus): boolean {
  return status !== "active";
}

/** มูลค่าถ่วงน้ำหนัก = รายได้คาดหวัง × ความน่าจะเป็น (minor units) */
export function weightedValue(expectedRevenue: number, probability: number): number {
  return roundHalfUp((expectedRevenue * probability) / 100);
}

export function clampProbability(p: number): number {
  if (Number.isNaN(p)) return 0;
  return Math.max(0, Math.min(100, Math.round(p)));
}

export interface PipelineTotals {
  count: number;
  expected: number; // รวมรายได้คาดหวัง (เฉพาะ active)
  weighted: number; // รวมถ่วงน้ำหนัก (เฉพาะ active)
}

/** สรุปยอด pipeline จากรายการ active (won/lost ไม่นับ) */
export function pipelineTotals(
  opps: ReadonlyArray<{ expectedRevenue: number; probability: number; status: OpportunityStatus }>,
): PipelineTotals {
  let count = 0;
  let expected = 0;
  let weighted = 0;
  for (const o of opps) {
    if (o.status !== "active") continue;
    count += 1;
    expected += o.expectedRevenue;
    weighted += weightedValue(o.expectedRevenue, o.probability);
  }
  return { count, expected, weighted };
}
