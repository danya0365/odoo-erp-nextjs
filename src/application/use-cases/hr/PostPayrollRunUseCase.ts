import type { PayrollRun } from "@/src/domain/entities";
import { payrollTotals } from "@/src/domain/services/payroll";
import { payrollEntryLines } from "@/src/domain/services/accounting";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IPayrollRunRepository } from "@/src/application/repositories/IPayrollRunRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";
import { postJournalEntry, type PostDeps } from "@/src/application/use-cases/accounting/postJournalEntry";

/** อนุมัติจ่ายเงินเดือน — ออกเลขเอกสาร + ลงบัญชี (DR เงินเดือน / CR เงินสด + ภาษีหัก) */
export class PostPayrollRunUseCase {
  constructor(
    private readonly runs: IPayrollRunRepository,
    private readonly sequences: ISequenceRepository,
    private readonly postDeps: PostDeps,
  ) {}

  async execute(shopId: string, runId: string, now: string): Promise<PayrollRun> {
    const run = await this.runs.findById(shopId, runId);
    if (!run) throw new Error("ไม่พบงวดเงินเดือน");
    if (run.status !== "draft") throw new Error("งวดนี้อนุมัติแล้ว");
    if (run.slips.length === 0) throw new Error("ไม่มีสลิปในงวดนี้");

    const totals = payrollTotals(run.slips);
    const seq = await this.sequences.next(shopId, "payroll_run");
    const docNumber = formatDocNumber("PR", seq, 5);

    await postJournalEntry(this.postDeps, {
      shopId,
      journalType: "general",
      sourceType: "payroll",
      sourceId: run.id,
      ref: docNumber,
      date: now,
      partnerId: null,
      draft: payrollEntryLines(totals),
    });

    return this.runs.update(shopId, runId, { docNumber, status: "posted" });
  }
}
