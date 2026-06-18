// ตรรกะ POS session (pure) — กระทบยอดเงินสดตอนปิดกะ
// เงินทั้งหมดเป็น integer minor units

/** เงินสดที่ควรมีในลิ้นชักตอนปิด = ตั้งต้น + ยอดขายเงินสดในกะ */
export function expectedCash(openingCash: number, cashSalesTotal: number): number {
  return openingCash + cashSalesTotal;
}

/** ผลต่าง = นับจริง − ที่ควรมี (บวก = เกิน, ลบ = ขาด) */
export function cashDifference(countedCash: number, expected: number): number {
  return countedCash - expected;
}
