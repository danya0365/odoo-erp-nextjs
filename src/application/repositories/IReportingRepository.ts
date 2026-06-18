// รายงานแบบรวม (read-only aggregates) — ทุก method scope ด้วย shopId
export interface DocSummary {
  count: number;
  total: number; // ผลรวมยอดเอกสาร (minor)
  paid: number; // ผลรวมที่ชำระแล้ว (minor)
}

export interface MonthTotalRow {
  month: string; // 'YYYY-MM'
  total: number;
}

export interface TopProductRow {
  productId: string;
  name: string;
  qty: number; // สเกล QTY_SCALE
  amount: number; // minor
}

export interface ValuationRow {
  productId: string;
  name: string;
  onHand: number; // สเกล QTY_SCALE
  unitCost: number; // minor
}

export interface IReportingRepository {
  /** ใบแจ้งหนี้ที่ไม่ถูกยกเลิก */
  salesSummary(shopId: string): Promise<DocSummary>;
  /** ใบตั้งหนี้ที่ไม่ถูกยกเลิก */
  purchaseSummary(shopId: string): Promise<DocSummary>;
  /** ยอดขายต่อเดือนจากใบแจ้งหนี้ (ไม่รวมยกเลิก) */
  salesByMonth(shopId: string): Promise<MonthTotalRow[]>;
  /** สินค้าขายดีตามมูลค่า จาก invoice_lines */
  topProducts(shopId: string, limit: number): Promise<TopProductRow[]>;
  /** สินค้า stockable ทั้งหมด + on-hand + ต้นทุน (สำหรับตีมูลค่าคงคลัง) */
  inventoryValuation(shopId: string): Promise<ValuationRow[]>;
}
