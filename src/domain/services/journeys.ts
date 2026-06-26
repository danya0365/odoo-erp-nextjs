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
  {
    id: "lead-to-order",
    title: "CRM: โอกาสการขาย → ปิดดีล → ใบขาย",
    description: "ติดตามโอกาสการขายในไปป์ไลน์ ปิดดีลที่ชนะ แล้วแปลงเป็นใบเสนอราคา",
    icon: "Target",
    estimatedTime: "3-4 นาที",
    steps: [
      { title: "สร้างโอกาสการขาย", description: "บันทึกลูกค้าเป้าหมาย + มูลค่าคาดหวัง + ความน่าจะเป็น", route: "/shop/crm/new", status: "done", note: "CreateOpportunity" },
      { title: "เลื่อนสเตจ → ปิดดีล (ชนะ)", description: "ลากผ่านไปป์ไลน์จนสถานะ won", route: "/shop/crm", status: "done", note: "ทำบนหน้ารายละเอียดโอกาส /shop/crm/[id] (MarkWon)" },
      { title: "แปลงเป็นใบเสนอราคา", description: "เปิดใบขายให้ลูกค้าที่ปิดดีลได้", route: "/shop/sales/new", status: "partial", note: "ออกใบขายได้ แต่ยังไม่มีปุ่ม convert ตรงจากดีล (สร้างใบขายเองโดยเลือกลูกค้าเดียวกัน)" },
    ],
  },
  {
    id: "make-to-stock",
    title: "การผลิต: สูตร BOM → สั่งผลิต → เข้าสต๊อก",
    description: "ตั้งสูตรการผลิต สั่งผลิต ตัดวัตถุดิบ และรับสินค้าสำเร็จรูปเข้าคลัง",
    icon: "Factory",
    estimatedTime: "4-5 นาที",
    steps: [
      { title: "สร้างสูตรการผลิต (BOM)", description: "กำหนดสินค้าสำเร็จรูป + วัตถุดิบต่อหน่วย", route: "/shop/manufacturing/boms/new", status: "done", note: "CreateBom" },
      { title: "สั่งผลิต", description: "เลือก BOM + จำนวน → สร้างใบสั่งผลิต", route: "/shop/manufacturing/new", status: "done", note: "CreateManufacturingOrder" },
      { title: "ผลิตเสร็จ", description: "ยืนยันผลิต → ตัดวัตถุดิบ (OUT) + รับสินค้าสำเร็จรูป (IN)", route: "/shop/manufacturing", status: "done", note: "ทำบนหน้ารายละเอียด /shop/manufacturing/[id]; stock moves ครบ" },
    ],
  },
  {
    id: "auto-replenish",
    title: "เติมสต๊อกอัตโนมัติ (จุดสั่งซื้อ → PO)",
    description: "ตั้งจุดสั่งซื้อ ดูสินค้าที่ต่ำกว่าเกณฑ์ แล้วออกใบสั่งซื้อเติม",
    icon: "Warehouse",
    estimatedTime: "3-4 นาที",
    steps: [
      { title: "ตั้งจุดสั่งซื้อ", description: "กำหนด min/max ต่อสินค้า", route: "/shop/inventory/reorder", status: "done", note: "ReorderRule" },
      { title: "ดูสินค้าที่ต่ำกว่าจุดสั่ง", description: "ระบบไฮไลต์สินค้าที่ต้องเติม", route: "/shop/inventory/reorder", status: "done", note: "คำนวณจาก on-hand เทียบ min" },
      { title: "ออก PO เติมสต๊อก", description: "สร้างใบสั่งซื้อจากสินค้าที่ขาด", route: "/shop/purchase/new", status: "partial", note: "ออก PO ได้ แต่ยังไม่มีปุ่มสร้าง PO อัตโนมัติจากหน้า reorder (ทำเอง)" },
    ],
  },
  {
    id: "stock-transfer",
    title: "โอนย้ายสินค้าระหว่างคลัง",
    description: "จัดการหลายคลัง โอนย้ายสินค้า และตรวจยอดคงเหลือ",
    icon: "ArrowLeftRight",
    estimatedTime: "2-3 นาที",
    steps: [
      { title: "ดู/สร้างคลังสินค้า", description: "จัดการคลัง (location) ของร้าน", route: "/shop/inventory/locations", status: "done", note: "StockLocation" },
      { title: "โอนย้ายระหว่างคลัง", description: "ย้ายสินค้าจากคลังหนึ่งไปอีกคลัง (OUT+IN)", route: "/shop/inventory/transfer", status: "done", note: "TransferStock — สมดุล qtyDelta" },
      { title: "ตรวจยอดคงเหลือ", description: "ดู on-hand รวมหลังโอน", route: "/shop/inventory", status: "done", note: "on-hand = SUM(stock_moves)" },
    ],
  },
  {
    id: "hire-to-payroll",
    title: "บุคลากร: เพิ่มพนักงาน → จ่ายเงินเดือน",
    description: "เพิ่มพนักงาน สร้างรอบเงินเดือน รัน และลงบัญชีค่าใช้จ่าย",
    icon: "Users2",
    estimatedTime: "3-4 นาที",
    steps: [
      { title: "เพิ่มพนักงาน", description: "บันทึกพนักงาน + ฐานเงินเดือน", route: "/shop/hr/employees", status: "done", note: "CreateEmployee" },
      { title: "สร้างรอบเงินเดือน", description: "เลือกงวด + พนักงานที่จ่าย", route: "/shop/hr/payroll/new", status: "done", note: "CreatePayrollRun" },
      { title: "รัน + ลงบัญชี", description: "ยืนยันรอบ → auto-post รายการเงินเดือน", route: "/shop/hr/payroll", status: "done", note: "ทำบนหน้ารายละเอียด /shop/hr/payroll/[id]; payrollEntryLines" },
    ],
  },
  {
    id: "project-delivery",
    title: "โครงการ + ลงเวลาทำงาน",
    description: "สร้างโครงการ เพิ่มงาน ลงเวลา และสรุปชั่วโมงทำงาน",
    icon: "FolderKanban",
    estimatedTime: "3-4 นาที",
    steps: [
      { title: "สร้างโครงการ", description: "ตั้งโครงการ + ลูกค้า", route: "/shop/projects/new", status: "done", note: "CreateProject" },
      { title: "เพิ่มงาน + ลงเวลา", description: "สร้าง task แล้วบันทึกชั่วโมงทำงาน", route: "/shop/projects", status: "done", note: "ทำบนหน้ารายละเอียด /shop/projects/[id]; LogTimesheet" },
      { title: "สรุปชั่วโมง", description: "ดูชั่วโมงรวมต่อโครงการ/งาน", route: "/shop/projects", status: "done", note: "sumMinutes/formatHours" },
    ],
  },
  {
    id: "record-to-report",
    title: "บัญชี: สมุดรายวัน → งบทดลอง",
    description: "ดูรายการที่ลงบัญชีอัตโนมัติ บันทึกปรับปรุงเอง และดูงบทดลองที่สมดุล",
    icon: "Calculator",
    estimatedTime: "3-4 นาที",
    steps: [
      { title: "ดูสมุดรายวัน (auto-posted)", description: "รายการบัญชีที่ระบบลงจากเอกสารต่างๆ", route: "/shop/accounting/entries", status: "done", note: "post จาก invoice/bill/payment/pos/payroll" },
      { title: "บันทึกรายการปรับปรุงเอง", description: "ลง journal entry เอง (เดบิต=เครดิต)", route: "/shop/accounting/entries/new", status: "done", note: "assertBalanced บังคับสมดุล" },
      { title: "ดูงบทดลอง", description: "Trial balance รวมทุกบัญชี", route: "/shop/accounting/trial-balance", status: "done", note: "เดบิตรวม = เครดิตรวม" },
    ],
  },
  {
    id: "business-overview",
    title: "ภาพรวมกิจการ + รายงาน",
    description: "ดูแดชบอร์ดสรุป รายงานการขาย และมูลค่าสินค้าคงคลัง",
    icon: "BarChart3",
    estimatedTime: "2-3 นาที",
    steps: [
      { title: "แดชบอร์ดภาพรวม", description: "กำไร เงินสด ลูกหนี้/เจ้าหนี้ ไปป์ไลน์", route: "/shop/reports", status: "done", note: "GetDashboardUseCase" },
      { title: "รายงานการขาย", description: "ยอดต่อเดือน + สินค้าขายดี", route: "/shop/reports/sales", status: "done" },
      { title: "มูลค่าสินค้าคงคลัง", description: "ตีมูลค่าสต๊อก + สินค้าหมด", route: "/shop/reports/inventory", status: "done" },
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
