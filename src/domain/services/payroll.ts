// ตรรกะเงินเดือน (pure) — เงินทั้งหมด integer minor units
import { roundHalfUp } from "@/src/domain/services/money";

export interface PayslipAmounts {
  gross: number;
  tax: number;
  net: number;
}

/** คำนวณสลิป 1 ใบจากฐานเงินเดือน + อัตราภาษีหัก ณ ที่จ่าย (basis points) */
export function computePayslip(baseSalary: number, whtRateBp: number): PayslipAmounts {
  const gross = baseSalary;
  const tax = roundHalfUp((gross * whtRateBp) / 10000);
  return { gross, tax, net: gross - tax };
}

/** รวมยอดทุกสลิปในงวด */
export function payrollTotals(
  slips: ReadonlyArray<PayslipAmounts>,
): PayslipAmounts {
  return slips.reduce(
    (acc, s) => ({ gross: acc.gross + s.gross, tax: acc.tax + s.tax, net: acc.net + s.net }),
    { gross: 0, tax: 0, net: 0 },
  );
}
