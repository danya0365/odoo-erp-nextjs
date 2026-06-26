// User Journey — เส้นทางการใช้งานจริงครบวงจร + map แต่ละ step ไป URL จริง + สถานะ
// ใช้ขับเคลื่อนหน้า /shop/journey (เดินดู flow) และ /shop/journey/coverage (เช็คลิสต์)
// pure data + helpers (ไม่แตะ DB, ไม่ import lucide — icon เป็น string key) แบบเดียวกับ roadmap-status.ts
// อัปเดต status ของแต่ละ step เมื่อทดสอบ journey นั้นจริง

export type StepStatus = "done" | "partial" | "missing";

export interface JourneyStep {
  title: string;
  description: string;
  /** URL จริงในแอปที่ step นี้ทำงาน (ต้องกดเปิดได้จริง — เลี่ยง bare [id]) */
  route: string;
  status: StepStatus;
  /** โน้ตสั้น: ทำอะไรได้/ติดอะไร */
  note?: string;
}

export interface Journey {
  id: string;
  title: string;
  description: string;
  /** key สำหรับ map ไป icon ในหน้า (domain คง pure) */
  icon: string;
  estimatedTime: string;
  steps: readonly JourneyStep[];
}

export const STEP_STATUS_META: Record<
  StepStatus,
  { label: string; variant: "success" | "warning" | "error" }
> = {
  done: { label: "มีแล้ว", variant: "success" },
  partial: { label: "บางส่วน", variant: "warning" },
  missing: { label: "ยังไม่มี", variant: "error" },
};

export const JOURNEYS: readonly Journey[] = [
  {
    id: "order-to-cash",
    title: "ขายครบวงจร (ใบเสนอราคา → รับเงิน)",
    description: "ตั้งแต่เพิ่มลูกค้า/สินค้า จนออกใบเสนอราคา ส่งของ วางบิล และรับชำระ",
    icon: "FileText",
    estimatedTime: "4-6 นาที",
    steps: [
      { title: "เพิ่มลูกค้า", description: "สร้างผู้ติดต่อประเภทลูกค้า", route: "/shop/contacts/new", status: "done", note: "CreatePartner — บันทึกแล้วกลับหน้า list" },
      { title: "เพิ่มสินค้า + เติมสต๊อก", description: "ตั้งราคาขาย/ทุน แล้วปรับสต๊อกตั้งต้น", route: "/shop/products/new", status: "done", note: "สร้างสินค้า → เข้าหน้าสินค้าเพื่อ 'ปรับสต๊อก'" },
      { title: "สร้างใบเสนอราคา", description: "เลือกลูกค้า + บรรทัดสินค้า → บันทึกใบเสนอราคา", route: "/shop/sales/new", status: "done", note: "snapshot ราคา/ภาษีลงบรรทัด" },
      { title: "เดินเอกสารขายจนจบ", description: "ยืนยัน → ส่งของ (ตัดสต๊อก) → ออกใบแจ้งหนี้ → รับชำระ", route: "/shop/sales", status: "done", note: "ทำบนหน้ารายละเอียดใบขาย /shop/sales/[id]; auto-post บัญชีทุกขั้น" },
    ],
  },
  {
    id: "procure-to-pay",
    title: "จัดซื้อครบวงจร (ขอราคา → จ่ายเงิน)",
    description: "ออกใบขอราคาผู้ขาย ยืนยัน รับของเข้าคลัง ตั้งหนี้ และจ่ายชำระ",
    icon: "ShoppingCart",
    estimatedTime: "3-5 นาที",
    steps: [
      { title: "สร้างใบขอราคา (RFQ)", description: "เลือกผู้ขาย + บรรทัดสินค้า → บันทึก", route: "/shop/purchase/new", status: "done", note: "CreateRfq" },
      { title: "เดินเอกสารจนจ่าย", description: "ยืนยัน → รับของ (เพิ่มสต๊อก) → ตั้งหนี้ → จ่ายชำระ", route: "/shop/purchase", status: "done", note: "ทำบนหน้ารายละเอียด /shop/purchase/[id]; stock IN + auto-post" },
    ],
  },
  {
    id: "online-store",
    title: "ลูกค้าสั่งซื้อออนไลน์",
    description: "ลูกค้าเปิดหน้าร้านสาธารณะ หยิบใส่ตะกร้า สั่งซื้อ แล้วออร์เดอร์เข้าหลังบ้าน",
    icon: "Globe",
    estimatedTime: "2-3 นาที",
    steps: [
      { title: "เปิดหน้าร้าน (public)", description: "ดูสินค้าวางจำหน่าย ไม่ต้องล็อกอิน", route: "/store/demo", status: "done", note: "หน้าร้าน slug 'demo'" },
      { title: "หยิบใส่ตะกร้า + เช็คเอาท์", description: "กรอกชื่อ/อีเมล → ยืนยันสั่งซื้อ → หน้ายืนยัน", route: "/store/demo", status: "done", note: "placeOrderAction (PRG redirect ไปหน้า order)" },
      { title: "ออร์เดอร์เข้าหลังบ้าน", description: "เห็นออร์เดอร์ออนไลน์ในระบบขาย", route: "/shop/storefront", status: "done", note: "ต้องล็อกอิน owner" },
    ],
  },
  {
    id: "pos-shift",
    title: "ขายหน้าร้าน (เปิดกะ → ปิดกะ)",
    description: "เปิดกะขาย ขายเร็วหน้าร้าน แล้วปิดกะสรุปยอด",
    icon: "Store",
    estimatedTime: "2-4 นาที",
    steps: [
      { title: "เปิดกะ", description: "เริ่มเซสชัน POS พร้อมเงินตั้งต้น", route: "/shop/pos/sessions", status: "done", note: "เปิดกะ → เข้าหน้าขาย" },
      { title: "ขายเร็ว", description: "เลือกสินค้า → ชำระ → ออร์เดอร์ + ตัดสต๊อก + ลงบัญชี", route: "/shop/pos", status: "done", note: "cashSaleEntryLines auto-post" },
      { title: "ปิดกะ", description: "สรุปยอดขาย/เงินสดในกะ", route: "/shop/pos/sessions", status: "done", note: "ปิดกะบนหน้ารายละเอียดเซสชัน" },
    ],
  },
];

export interface CoverageSummary {
  total: number;
  done: number;
  partial: number;
  missing: number;
  /** % ของ step ที่ทำได้ (done นับเต็ม, partial นับครึ่ง) ปัดจำนวนเต็ม */
  donePercent: number;
}

export function journeyCoverage(steps: readonly JourneyStep[]): CoverageSummary {
  const done = steps.filter((s) => s.status === "done").length;
  const partial = steps.filter((s) => s.status === "partial").length;
  const missing = steps.filter((s) => s.status === "missing").length;
  const total = steps.length;
  const donePercent = total === 0 ? 0 : Math.round(((done + partial * 0.5) / total) * 100);
  return { total, done, partial, missing, donePercent };
}

export interface OverallCoverage {
  journeys: number;
  totalSteps: number;
  doneSteps: number;
  donePercent: number;
}

export function overallCoverage(journeys: readonly Journey[]): OverallCoverage {
  const allSteps = journeys.flatMap((j) => j.steps);
  const c = journeyCoverage(allSteps);
  return {
    journeys: journeys.length,
    totalSteps: c.total,
    doneSteps: c.done,
    donePercent: c.donePercent,
  };
}
