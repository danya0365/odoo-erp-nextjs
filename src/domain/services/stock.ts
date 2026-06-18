// ตรรกะสต๊อก (pure) — on-hand มาจากผลรวม ledger; กันสต๊อกติดลบ
export function onHandFromMoves(moves: ReadonlyArray<{ qtyDelta: number }>): number {
  return moves.reduce((sum, m) => sum + m.qtyDelta, 0);
}

/** ตรวจว่าหัก (qtyDelta ติดลบ) แล้วไม่ทำให้สต๊อกติดลบ */
export function canApplyDelta(onHand: number, qtyDelta: number): boolean {
  return onHand + qtyDelta >= 0;
}

/** ถึงจุดสั่งซื้อซ้ำเมื่อ on-hand ≤ ขั้นต่ำ */
export function needsReorder(onHand: number, minQty: number): boolean {
  return onHand <= minQty;
}

/** ปริมาณที่ควรเติม = max − onHand (เมื่อถึงจุดสั่งซื้อ), ไม่งั้น 0 */
export function reorderSuggestion(onHand: number, minQty: number, maxQty: number): number {
  if (onHand > minQty) return 0;
  return Math.max(0, maxQty - onHand);
}

/** โอนย้ายได้เมื่อจำนวน > 0 และไม่เกิน on-hand ต้นทาง */
export function canTransfer(sourceOnHand: number, qty: number): boolean {
  return qty > 0 && qty <= sourceOnHand;
}
