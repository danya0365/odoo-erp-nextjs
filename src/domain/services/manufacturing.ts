// ตรรกะการผลิต (pure) — ปริมาณวัตถุดิบที่ต้องใช้ + ต้นทุนสูตร + ความพร้อมสต๊อก
import { roundHalfUp, QTY_SCALE } from "@/src/domain/services/money";

/** วัตถุดิบที่ต้องใช้ = ใช้ต่อหน่วย × จำนวนที่ผลิต (ทั้งคู่สเกล QTY_SCALE) */
export function componentRequirement(qtyPerUnit: number, produceQty: number): number {
  return roundHalfUp((qtyPerUnit * produceQty) / QTY_SCALE);
}

/** ต้นทุนผลิตต่อสินค้าสำเร็จรูป 1 หน่วย (minor) = Σ ใช้ต่อหน่วย × ต้นทุน/หน่วย */
export function bomUnitCost(
  components: ReadonlyArray<{ qtyPerUnit: number; unitCost: number }>,
): number {
  return components.reduce(
    (sum, c) => sum + roundHalfUp((c.qtyPerUnit * c.unitCost) / QTY_SCALE),
    0,
  );
}

export interface ComponentAvailability {
  required: number;
  onHand: number;
}

/** ผลิตได้เมื่อวัตถุดิบทุกตัวมีพอ (on-hand ≥ ที่ต้องใช้) */
export function hasComponentsAvailable(
  items: ReadonlyArray<ComponentAvailability>,
): boolean {
  return items.every((i) => i.onHand >= i.required);
}
