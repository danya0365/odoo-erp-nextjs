// ตรรกะสต๊อก (pure) — on-hand มาจากผลรวม ledger; กันสต๊อกติดลบ
export function onHandFromMoves(moves: ReadonlyArray<{ qtyDelta: number }>): number {
  return moves.reduce((sum, m) => sum + m.qtyDelta, 0);
}

/** ตรวจว่าหัก (qtyDelta ติดลบ) แล้วไม่ทำให้สต๊อกติดลบ */
export function canApplyDelta(onHand: number, qtyDelta: number): boolean {
  return onHand + qtyDelta >= 0;
}
