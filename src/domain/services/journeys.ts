// User Journey — เส้นทางการใช้งานจริงครบวงจร + map แต่ละ step ไป URL จริง + สถานะ
// ใช้ขับเคลื่อนหน้า /shop/journey (เดินดู flow) และ /shop/journey/coverage (เช็คลิสต์)
// pure data + helpers (ไม่แตะ DB, ไม่ import lucide — icon เป็น string key) แบบเดียวกับ roadmap-status.ts
// อัปเดต status ของแต่ละ step เมื่อทดสอบ journey นั้นจริง

export type StepStatus = "done" | "partial" | "missing";

/** supported = flow ที่ระบบรองรับแล้ว · real-world = สถานการณ์จริงที่ยังขาดฟีเจอร์ (gap-driven) */
export type JourneyKind = "supported" | "real-world";

export interface JourneyStep {
  title: string;
  description: string;
  /** URL จริงในแอปที่ step นี้ทำงาน (ต้องกดเปิดได้จริง — เลี่ยง bare [id]); ไม่มี = ยังไม่มีหน้า */
  route?: string;
  status: StepStatus;
  /** โน้ตสั้น: ทำอะไรได้/ติดอะไร/ต้องสร้างอะไร */
  note?: string;
}

export interface Journey {
  id: string;
  title: string;
  description: string;
  /** key สำหรับ map ไป icon ในหน้า (domain คง pure) */
  icon: string;
  estimatedTime: string;
  /** ไม่ระบุ = supported (flow ที่ทำแล้ว) */
  kind?: JourneyKind;
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
      { title: "แปลงเป็นใบเสนอราคา", description: "ปุ่มแปลงดีลที่ชนะ → ใบเสนอราคา", route: "/shop/crm", status: "done", note: "convertToQuotationAction (ปุ่มในหน้าโอกาส /shop/crm/[id])" },
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
      { title: "ออก PO เติมสต๊อก", description: "ปุ่มสร้างใบสั่งซื้อจากรายการที่ต้องเติม", route: "/shop/inventory/reorder", status: "done", note: "ลิงก์ 'สร้างใบสั่งซื้อ' → /shop/purchase/new?product= (preselect สินค้า)" },
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

  // ========== สถานการณ์จริง (gap-driven) — step "ยังไม่มี" = ฟีเจอร์ที่ต้องทำต่อ ==========

  // --- ฝั่งขาย/ลูกค้า ---
  {
    id: "sales-return",
    title: "ลูกค้าคืนสินค้า / คืนเงิน (RMA)",
    description: "ลูกค้าขอคืนสินค้าหลังซื้อ → อนุมัติ → รับของกลับ → ออกใบลดหนี้ → คืนเงิน",
    icon: "Undo2",
    estimatedTime: "3-4 นาที",
    kind: "real-world",
    steps: [
      { title: "เปิดออเดอร์เดิมของลูกค้า", description: "ค้นหาใบขาย/ใบแจ้งหนี้ที่จะคืน", route: "/shop/sales", status: "done", note: "ดูใบขายเดิมได้" },
      { title: "สร้างคำขอคืนสินค้า", description: "เลือกใบแจ้งหนี้ + จำนวนที่คืน + เหตุผล (RMA)", route: "/shop/sales/returns/new", status: "done", note: "CreateSalesReturn (snapshot ราคาจากใบแจ้งหนี้, กันคืนเกิน)" },
      { title: "รับของกลับเข้าสต๊อก", description: "ยืนยันคืน → stock move IN", route: "/shop/sales/returns", status: "done", note: "ConfirmSalesReturn — on-hand กลับเพิ่ม (sales_return)" },
      { title: "ออกใบลดหนี้ (credit note)", description: "ลดยอดลูกหนี้/กลับรายการบัญชี อัตโนมัติ", route: "/shop/sales/returns", status: "done", note: "PostCreditNote — DR รายได้+ภาษีขาย / CR ลูกหนี้" },
      { title: "คืนเงินลูกค้า", description: "จ่ายคืน + ลงบัญชี", route: "/shop/sales/returns", status: "done", note: "RefundSalesReturn — payment outbound + DR ลูกหนี้ / CR เงินสด" },
    ],
  },
  {
    id: "deposit-installment",
    title: "รับมัดจำ + ผ่อนชำระหลายงวด",
    description: "ลูกค้าวางมัดจำก่อน แล้วผ่อนเป็นงวดจนปิดยอด",
    icon: "CalendarClock",
    estimatedTime: "3-4 นาที",
    kind: "real-world",
    steps: [
      { title: "สร้างใบขาย + ออกใบแจ้งหนี้", description: "ตั้งยอดรวม", route: "/shop/sales/new", status: "done" },
      { title: "ตั้งแผนผ่อนชำระเป็นงวด", description: "จำนวนงวด + ระยะห่าง (งวดแรก=มัดจำ)", route: "/shop/sales/installments/new", status: "done", note: "CreateInstallmentPlan (buildSchedule)" },
      { title: "เก็บเงินมัดจำ (งวดแรก)", description: "ครบกำหนดวันนี้", route: "/shop/sales/installments", status: "done", note: "PayInstallment งวด 1" },
      { title: "เก็บเงินแต่ละงวด", description: "ติดตามงวดที่ถึงกำหนด + คงเหลือ", route: "/shop/sales/installments", status: "done", note: "PayInstallment + ลงบัญชี DR เงินสด/CR ลูกหนี้" },
      { title: "ปิดยอดเมื่อครบ", description: "แผน completed + ใบแจ้งหนี้ชำระครบ", route: "/shop/sales/installments", status: "done", note: "isPlanComplete → completed" },
    ],
  },
  {
    id: "promotion-loyalty",
    title: "โปรโมชั่น / ส่วนลด / สะสมแต้ม",
    description: "ตั้งโปรโมชั่น ลูกค้าซื้อเข้าเงื่อนไขได้ส่วนลด และสะสม/ใช้แต้ม",
    icon: "Tag",
    estimatedTime: "2-3 นาที",
    kind: "real-world",
    steps: [
      { title: "ตั้งโปรโมชั่น/คูปอง", description: "โค้ด + %/จำนวน + ยอดขั้นต่ำ", route: "/shop/marketing", status: "done", note: "CreatePromotion" },
      { title: "ตรวจเงื่อนไขขั้นต่ำ", description: "เช็คยอดซื้อเข้าเกณฑ์โปร", route: "/shop/marketing", status: "done", note: "ApplyPromotion (eligible)" },
      { title: "คิดส่วนลดอัตโนมัติ", description: "คำนวณส่วนลด + ยอดหลังลด", route: "/shop/marketing", status: "done", note: "discountAmount (เครื่องคิดส่วนลด)" },
      { title: "สะสม/แลกแต้มสมาชิก", description: "100฿ = 1 แต้ม + แลกแต้ม", route: "/shop/marketing", status: "done", note: "Earn/Redeem points" },
    ],
  },

  // --- การเงิน/บัญชี/ภาษี ---
  {
    id: "credit-collection",
    title: "ขายเชื่อ → ดูอายุหนี้ → ทวงหนี้",
    description: "ตั้งเครดิตเทอม ดูอายุลูกหนี้ ส่งใบทวง และรับชำระ",
    icon: "Receipt",
    estimatedTime: "3-4 นาที",
    kind: "real-world",
    steps: [
      { title: "ตั้งเครดิตเทอมลูกค้า", description: "จำนวนวันให้เครดิต", route: "/shop/contacts/new", status: "done", note: "ฟิลด์ creditTermDays บน partner" },
      { title: "ดูยอดค้างต่อลูกค้า (statement)", description: "ยอดค้างรวม + แยกช่วงอายุ", route: "/shop/accounting/receivables", status: "done", note: "สรุปต่อลูกค้าในรายงานอายุหนี้" },
      { title: "ดูรายงานอายุหนี้ (AR aging)", description: "ค้าง 0-30/31-60/61-90/90+ วัน", route: "/shop/accounting/receivables", status: "done", note: "GetArAging (summarizeAging)" },
      { title: "ส่งใบทวงหนี้ (dunning)", description: "บันทึกการทวง + วันที่ล่าสุด", route: "/shop/accounting/receivables", status: "done", note: "RecordDunning (dunning_logs)" },
      { title: "รับชำระ", description: "ตัดยอดลูกหนี้", route: "/shop/sales", status: "done", note: "รับชำระต่อใบในหน้าใบขาย" },
    ],
  },
  {
    id: "vat-filing",
    title: "สรุปภาษีมูลค่าเพิ่ม ภพ.30",
    description: "รวมภาษีขาย/ภาษีซื้อ ออกรายงานภาษี และบันทึกการยื่น ภพ.30",
    icon: "FileSpreadsheet",
    estimatedTime: "2-3 นาที",
    kind: "real-world",
    steps: [
      { title: "รวบรวมภาษีขาย/ภาษีซื้อ", description: "จากสมุดรายวันในงวด (auto)", route: "/shop/accounting/vat", status: "done", note: "ดึงจากบัญชี output/input VAT ตามช่วงเดือน" },
      { title: "รายงานภาษีซื้อ-ขาย + ภพ.30", description: "ยอดสุทธิที่ต้องชำระ/ขอคืน", route: "/shop/accounting/vat", status: "done", note: "GetVatReport — netPayable = ภาษีขาย − ภาษีซื้อ" },
      { title: "บันทึกการยื่น ภพ.30", description: "snapshot งวด + กันยื่นซ้ำ", route: "/shop/accounting/vat", status: "done", note: "FileVatReturn (vat_filings)" },
    ],
  },
  {
    id: "bank-recon-close",
    title: "กระทบยอดธนาคาร + ปิดงวดบัญชี",
    description: "นำเข้ารายการเดินบัญชี กระทบยอด ปรับปรุง แล้วปิดงวด ออกงบการเงิน",
    icon: "Landmark",
    estimatedTime: "3-4 นาที",
    kind: "real-world",
    steps: [
      { title: "นำเข้ารายการเดินบัญชีธนาคาร", description: "กรอก/นำเข้ารายการ statement", route: "/shop/accounting/bank-reconciliation", status: "done", note: "ImportBankLine" },
      { title: "กระทบยอดกับสมุดบัญชี", description: "ทำเครื่องหมายกระทบยอด + เทียบยอดเงินสดตามสมุด", route: "/shop/accounting/bank-reconciliation", status: "done", note: "ReconcileBankLine" },
      { title: "บันทึกรายการปรับปรุง", description: "ค่าธรรมเนียม/ดอกเบี้ย ฯลฯ", route: "/shop/accounting/entries/new", status: "done" },
      { title: "ปิดงวดบัญชี", description: "ล็อกงวด (กันปิดซ้ำ)", route: "/shop/accounting/financials", status: "done", note: "ClosePeriod (period_closes)" },
      { title: "ออกงบการเงิน", description: "งบกำไรขาดทุน + งบดุลสมดุล", route: "/shop/accounting/financials", status: "done", note: "GetFinancials (financialStatement)" },
    ],
  },

  // --- คลัง/จัดซื้อ/ผลิต ---
  {
    id: "stocktake",
    title: "ตรวจนับสต๊อกประจำปี (stocktake)",
    description: "เปิดรอบนับ นับจริง เทียบส่วนต่างกับระบบ แล้วปรับปรุงยอด",
    icon: "ClipboardCheck",
    estimatedTime: "3-5 นาที",
    kind: "real-world",
    steps: [
      { title: "เปิดรอบตรวจนับ", description: "snapshot ยอดระบบของสินค้า stockable ทุกตัว", route: "/shop/inventory/stocktake", status: "done", note: "CreateStockCount (docNumber SC)" },
      { title: "บันทึกยอดนับจริง", description: "กรอกจำนวนที่นับได้ต่อรายการ", route: "/shop/inventory/stocktake", status: "done", note: "ในหน้ารายละเอียดรอบนับ" },
      { title: "เทียบส่วนต่างกับระบบ", description: "variance = นับ − on-hand", route: "/shop/inventory/stocktake", status: "done", note: "แสดงส่วนต่าง + ปรับเฉพาะที่ต่าง" },
      { title: "ปรับปรุงสต๊อกตามผลนับ", description: "ออก stock adjust อัตโนมัติ", route: "/shop/inventory/stocktake", status: "done", note: "ApplyStockCount (sourceType stocktake) → on-hand = ยอดนับ" },
    ],
  },
  {
    id: "lot-expiry",
    title: "ติดตามล็อต / วันหมดอายุ (FEFO)",
    description: "รับเข้าระบุล็อต+วันหมดอายุ ขายตัดแบบหมดอายุก่อน และเตือนใกล้หมดอายุ",
    icon: "PackageCheck",
    estimatedTime: "2-3 นาที",
    kind: "real-world",
    steps: [
      { title: "รับเข้าระบุล็อต/วันหมดอายุ", description: "ผูกล็อต+วันหมดอายุกับการรับของ", route: "/shop/inventory/lots", status: "done", note: "ReceiveLot (product_lots)" },
      { title: "ขายตัดสต๊อกแบบ FEFO", description: "หมดอายุก่อน-ออกก่อน", route: "/shop/inventory/lots", status: "done", note: "AllocateFefo (allocateFefo)" },
      { title: "แจ้งเตือนสินค้าใกล้หมดอายุ", description: "รายการล็อตใกล้/หมดอายุ", route: "/shop/inventory/lots", status: "done", note: "isExpiringSoon/isExpired (≤30 วัน)" },
    ],
  },
  {
    id: "purchase-return-qc",
    title: "รับของ → ตรวจ QC → คืนของเสียผู้ขาย",
    description: "รับของเข้า ตรวจคุณภาพ ของเสียคืนผู้ขาย และรับใบลดหนี้ผู้ขาย",
    icon: "PackageX",
    estimatedTime: "3-4 นาที",
    kind: "real-world",
    steps: [
      { title: "รับของเข้าจาก PO", description: "receive เข้าสต๊อก", route: "/shop/purchase", status: "done" },
      { title: "ตรวจคุณภาพ (QC)", description: "บันทึกผล QC ตอนสร้างใบคืน", route: "/shop/purchase/returns/new", status: "done", note: "เก็บผล QC/เหตุผลในใบคืน" },
      { title: "คืนของเสียให้ผู้ขาย", description: "ยืนยัน → stock OUT", route: "/shop/purchase/returns", status: "done", note: "ConfirmPurchaseReturn (sourceType purchase_return)" },
      { title: "รับใบลดหนี้ผู้ขาย", description: "ลดยอดเจ้าหนี้ อัตโนมัติ", route: "/shop/purchase/returns", status: "done", note: "PostVendorCredit — DR เจ้าหนี้ / CR ค่าใช้จ่าย+ภาษีซื้อ" },
    ],
  },

  // --- คน/เวิร์กโฟลว์/บริการ ---
  {
    id: "leave-attendance",
    title: "ลงเวลา / ลางาน / OT",
    description: "พนักงานลงเวลาเข้า-ออก ขอลา อนุมัติ และสรุปชั่วโมงเข้าเงินเดือน",
    icon: "CalendarDays",
    estimatedTime: "2-3 นาที",
    kind: "real-world",
    steps: [
      { title: "ลงเวลาทำงาน/OT", description: "บันทึกชั่วโมง + OT รายวัน", route: "/shop/hr/timeoff", status: "done", note: "LogAttendance" },
      { title: "ยื่นขอลา", description: "ลาป่วย/ลากิจ/พักร้อน + จำนวนวัน", route: "/shop/hr/timeoff", status: "done", note: "CreateLeaveRequest" },
      { title: "ผู้จัดการอนุมัติ", description: "อนุมัติ/ปฏิเสธคำขอลา", route: "/shop/hr/timeoff", status: "done", note: "DecideLeaveRequest (state machine)" },
      { title: "สรุปชั่วโมงเข้าเงินเดือน", description: "สรุปชั่วโมง/OT ต่อพนักงานเพื่ออ้างอิง", route: "/shop/hr/timeoff", status: "done", note: "ตารางสรุป → ใช้กับ payroll" },
    ],
  },
  {
    id: "expense-claim",
    title: "เบิกค่าใช้จ่ายพนักงาน",
    description: "พนักงานยื่นเบิก ผู้จัดการอนุมัติ จ่ายคืน และลงบัญชี",
    icon: "ReceiptText",
    estimatedTime: "2-3 นาที",
    kind: "real-world",
    steps: [
      { title: "พนักงานยื่นเบิก", description: "เลือกพนักงาน + หมวด + จำนวน", route: "/shop/hr/expenses/new", status: "done", note: "CreateExpenseClaim (status submitted)" },
      { title: "ผู้จัดการอนุมัติ", description: "อนุมัติ/ปฏิเสธ", route: "/shop/hr/expenses", status: "done", note: "Approve/Reject (state machine)" },
      { title: "จ่ายคืนพนักงาน", description: "ปุ่มจ่ายคืนในใบเบิก", route: "/shop/hr/expenses", status: "done", note: "PayExpenseClaim (paidAt)" },
      { title: "ลงบัญชีค่าใช้จ่าย", description: "auto-post DR ค่าใช้จ่าย / CR เงินสด", route: "/shop/hr/expenses", status: "done", note: "PostExpense (sourceType expense)" },
    ],
  },
  {
    id: "service-ticket",
    title: "งานบริการ / ซ่อม / นัดหมาย",
    description: "ลูกค้าแจ้งซ่อม เปิด ticket นัดหมาย มอบหมายช่าง ปิดงานและเก็บเงิน",
    icon: "Wrench",
    estimatedTime: "2-3 นาที",
    kind: "real-world",
    steps: [
      { title: "ลูกค้าแจ้งปัญหา/ขอบริการ", description: "เปิดใบงาน + เรื่อง/รายละเอียด", route: "/shop/service/new", status: "done", note: "CreateServiceTicket (open)" },
      { title: "นัดหมาย", description: "ตั้งวัน-เวลานัดหมาย", route: "/shop/service", status: "done", note: "scheduledAt ตอนมอบหมาย" },
      { title: "มอบหมายช่าง/ทีม", description: "assign + เปลี่ยนสถานะ", route: "/shop/service", status: "done", note: "AssignServiceTicket → assigned" },
      { title: "ปิดงาน + เก็บเงิน", description: "ปิดงาน → ออกใบขาย/เก็บเงิน", route: "/shop/service", status: "done", note: "CloseServiceTicket + ลิงก์ออกใบขาย" },
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

export function journeyKind(j: Journey): JourneyKind {
  return j.kind ?? "supported";
}

export function supportedJourneys(): Journey[] {
  return JOURNEYS.filter((j) => journeyKind(j) === "supported");
}

export function realWorldJourneys(): Journey[] {
  return JOURNEYS.filter((j) => journeyKind(j) === "real-world");
}

export interface GapItem {
  /** ชื่อฟีเจอร์/ความสามารถที่ยังขาด (= ชื่อ step) */
  feature: string;
  /** missing = ยังไม่มีเลย, partial = มีบางส่วน */
  status: Exclude<StepStatus, "done">;
  note?: string;
  /** journey ที่ต้องใช้ฟีเจอร์นี้ */
  inJourneys: string[];
}

/**
 * รวม step ที่ยังไม่ done ทุก journey → รายการฟีเจอร์ที่ต้องทำ (dedup ตามชื่อ feature)
 * เรียง missing ก่อน partial เพื่อให้เห็นของที่ขาดทั้งดุ้นก่อน
 */
export function gapBacklog(journeys: readonly Journey[]): GapItem[] {
  const byFeature = new Map<string, GapItem>();
  for (const j of journeys) {
    for (const s of j.steps) {
      if (s.status === "done") continue;
      const existing = byFeature.get(s.title);
      if (existing) {
        if (!existing.inJourneys.includes(j.title)) existing.inJourneys.push(j.title);
        // ยกระดับเป็น missing ถ้าเจอที่ไหนสักที่ยังไม่มีเลย
        if (s.status === "missing") existing.status = "missing";
      } else {
        byFeature.set(s.title, {
          feature: s.title,
          status: s.status,
          note: s.note,
          inJourneys: [j.title],
        });
      }
    }
  }
  const order: Record<Exclude<StepStatus, "done">, number> = { missing: 0, partial: 1 };
  return [...byFeature.values()].sort((a, b) => order[a.status] - order[b.status]);
}

export interface GapSummary {
  missing: number;
  partial: number;
  total: number;
}

export function gapSummary(journeys: readonly Journey[]): GapSummary {
  const items = gapBacklog(journeys);
  const missing = items.filter((i) => i.status === "missing").length;
  const partial = items.filter((i) => i.status === "partial").length;
  return { missing, partial, total: items.length };
}
