/** ตัวนับเลขเอกสารต่อ shop — increment อะตอมมิก คืนค่าเลขที่ใช้ได้ (1,2,3,...) */
export interface ISequenceRepository {
  /** เพิ่มและคืนเลขลำดับถัดไปสำหรับ (shopId, key); สร้าง row อัตโนมัติถ้ายังไม่มี */
  next(shopId: string, key: string): Promise<number>;
}
