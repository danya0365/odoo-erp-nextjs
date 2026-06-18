import type { PayrollRun } from "@/src/domain/entities";
import { computePayslip } from "@/src/domain/services/payroll";
import type { IEmployeeRepository } from "@/src/application/repositories/IEmployeeRepository";
import type { IPayrollRunRepository } from "@/src/application/repositories/IPayrollRunRepository";

/** สร้างงวดเงินเดือน (draft) — ออกสลิปให้พนักงานที่ทำงานอยู่ทุกคนตามฐานเงินเดือน */
export class GeneratePayrollRunUseCase {
  constructor(
    private readonly employees: IEmployeeRepository,
    private readonly runs: IPayrollRunRepository,
  ) {}

  async execute(shopId: string, period: string, whtRateBp: number): Promise<PayrollRun> {
    if (!/^\d{4}-\d{2}$/.test(period)) throw new Error("รูปแบบงวดต้องเป็น YYYY-MM");
    if (whtRateBp < 0) throw new Error("อัตราภาษีต้องไม่ติดลบ");
    const staff = await this.employees.listActive(shopId);
    if (staff.length === 0) throw new Error("ยังไม่มีพนักงานที่ทำงานอยู่");

    const slips = staff.map((e) => {
      const a = computePayslip(e.baseSalary, whtRateBp);
      return { employeeId: e.id, gross: a.gross, tax: a.tax, net: a.net };
    });
    return this.runs.createWithSlips({ shopId, period, whtRateBp, slips });
  }
}
