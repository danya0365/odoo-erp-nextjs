// ตรรกะปริมาณ partial delivery/receipt/invoice (pure) — qty เป็น integer สเกล QTY_SCALE
export interface LineProgress {
  ordered: number;
  done: number; // delivered / received / invoiced
}

export function remaining(line: LineProgress): number {
  return Math.max(0, line.ordered - line.done);
}

/** ทำเพิ่มได้ไหม: ต้อง > 0 และไม่เกินที่เหลือ */
export function canProgress(line: LineProgress, requested: number): boolean {
  return requested > 0 && line.done + requested <= line.ordered;
}

export function isLineFull(line: LineProgress): boolean {
  return line.done >= line.ordered;
}

export function isAllFull(lines: ReadonlyArray<LineProgress>): boolean {
  return lines.length > 0 && lines.every(isLineFull);
}

export function isAnyStarted(lines: ReadonlyArray<LineProgress>): boolean {
  return lines.some((l) => l.done > 0);
}

/** สรุปสถานะ progress รวมของเอกสาร */
export type ProgressState = "none" | "partial" | "full";

export function progressState(lines: ReadonlyArray<LineProgress>): ProgressState {
  if (isAllFull(lines)) return "full";
  if (isAnyStarted(lines)) return "partial";
  return "none";
}
