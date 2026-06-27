// แผนผ่อนชำระ (installment) — pure, ไม่มี I/O · จำนวนเป็น integer minor units
export interface ScheduleLine {
  seq: number;
  dueDate: string; // ISO
  amount: number;
}

/** แบ่งยอดรวมเป็น N งวดเท่ากัน (งวดสุดท้ายรับเศษ) เริ่มงวดแรกวันนี้ ห่างกัน intervalDays */
export function buildSchedule(total: number, count: number, intervalDays: number, startIso: string): ScheduleLine[] {
  if (count < 1) throw new Error("จำนวนงวดต้องอย่างน้อย 1");
  if (total <= 0) throw new Error("ยอดรวมต้องมากกว่า 0");
  const per = Math.floor(total / count);
  const start = new Date(startIso);
  const lines: ScheduleLine[] = [];
  let allocated = 0;
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const amount = isLast ? total - allocated : per;
    allocated += amount;
    const due = new Date(start.getTime());
    due.setUTCDate(due.getUTCDate() + i * intervalDays);
    lines.push({ seq: i + 1, dueDate: due.toISOString(), amount });
  }
  return lines;
}

/** แผนเสร็จเมื่อทุกงวดชำระครบ */
export function isPlanComplete(lines: ReadonlyArray<{ status: "pending" | "paid" }>): boolean {
  return lines.length > 0 && lines.every((l) => l.status === "paid");
}

export function outstandingOf(lines: ReadonlyArray<{ amount: number; paidAmount: number }>): number {
  return lines.reduce((s, l) => s + (l.amount - l.paidAmount), 0);
}
