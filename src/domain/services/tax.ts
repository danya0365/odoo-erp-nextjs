// ภาษีมูลค่าเพิ่ม (VAT / ภพ.30) — pure, ไม่มี I/O
// จำนวนเป็น integer minor units (สตางค์)

export interface VatSummary {
  /** ภาษีขาย (output VAT) — เก็บจากลูกค้า */
  outputVat: number;
  /** ภาษีซื้อ (input VAT) — จ่ายให้ผู้ขาย */
  inputVat: number;
  /** ภาษีที่ต้องชำระ (บวก) / ขอคืนหรือยกไป (ลบ) = ภาษีขาย − ภาษีซื้อ */
  netPayable: number;
}

export function vatSummary(outputVat: number, inputVat: number): VatSummary {
  return { outputVat, inputVat, netPayable: outputVat - inputVat };
}

/** เดือนภาษีในรูป "YYYY-MM" → ช่วงวันที่ ISO (ต้น–ปลายเดือน) สำหรับ query */
export function monthRange(month: string): { from: string; to: string; periodEnd: string } {
  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)); // วันที่ 0 ของเดือนถัดไป = วันสุดท้ายของเดือนนี้
  return { from: from.toISOString(), to: end.toISOString(), periodEnd: end.toISOString().slice(0, 10) };
}
