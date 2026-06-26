// Roadmap / feature-status — ข้อมูล curated ว่า module ไหนทำแล้ว/ยัง (ตรวจสอบผ่านหน้า /shop/roadmap)
// อัปเดตคู่กับ .claude/memory/core/feature-status.md + roadmap.md
// pure data + summary (ไม่แตะ DB) — แบบเดียวกับ DEFAULT_ACCOUNTS / DEFAULT_CRM_STAGES

export type RoadmapStatus = "done" | "review" | "planned";
export type RoadmapTier = "P1" | "P2" | "P3";

export interface RoadmapItemDef {
  /** key เสถียรไว้อ้างอิง/ทดสอบ */
  key: string;
  /** ชื่อแสดงผล (ไทย) */
  label: string;
  /** คำอธิบายสั้น */
  desc: string;
  status: RoadmapStatus;
  /** เฉพาะ planned: ลำดับความสำคัญ */
  tier?: RoadmapTier;
  /** เฉพาะ done: ลิงก์ไปหน้า module */
  href?: string;
}

// 13 modules ที่ build แล้ว (ตรงกับ MODULES ใน app/(shop)/shop/page.tsx)
const DONE: readonly RoadmapItemDef[] = [
  { key: "crm", label: "CRM", desc: "ไปป์ไลน์โอกาสการขาย", status: "done", href: "/shop/crm" },
  { key: "contacts", label: "ผู้ติดต่อ", desc: "ลูกค้าและผู้ขาย", status: "done", href: "/shop/contacts" },
  { key: "products", label: "สินค้า", desc: "สินค้าและสต๊อก", status: "done", href: "/shop/products" },
  { key: "inventory", label: "คลังสินค้า", desc: "หลายคลัง→โอนย้าย→จุดสั่งซื้อ", status: "done", href: "/shop/inventory" },
  { key: "manufacturing", label: "การผลิต", desc: "สูตร BOM→สั่งผลิต→ตัดวัตถุดิบ", status: "done", href: "/shop/manufacturing" },
  { key: "pos", label: "ขายหน้าร้าน (POS)", desc: "เปิดกะ→ขายเร็ว→ปิดกะ", status: "done", href: "/shop/pos" },
  { key: "storefront", label: "หน้าร้านออนไลน์", desc: "ออร์เดอร์จากเว็บ→ใบขาย", status: "done", href: "/shop/storefront" },
  { key: "sales", label: "การขาย", desc: "ใบเสนอราคา→ส่ง→วางบิล→ชำระ", status: "done", href: "/shop/sales" },
  { key: "purchase", label: "การจัดซื้อ", desc: "ขอราคา→รับของ→ตั้งหนี้→จ่าย", status: "done", href: "/shop/purchase" },
  { key: "accounting", label: "บัญชี", desc: "สมุดรายวัน→ผังบัญชี→งบทดลอง (double-entry)", status: "done", href: "/shop/accounting" },
  { key: "hr", label: "บุคลากร / เงินเดือน", desc: "พนักงาน→เงินเดือน→ลงบัญชี", status: "done", href: "/shop/hr" },
  { key: "projects", label: "โครงการ / ลงเวลา", desc: "งาน→ลงเวลา→สรุปชั่วโมง", status: "done", href: "/shop/projects" },
  { key: "reports", label: "รายงาน / แดชบอร์ด", desc: "ภาพรวมกิจการ + วิเคราะห์", status: "done", href: "/shop/reports" },
];

// ทำแล้วแต่รอตัดสินใจ (keep/revert)
const REVIEW: readonly RoadmapItemDef[] = [
  { key: "store-reviews", label: "รีวิวร้านค้า", desc: "ลูกค้ารีวิวหน้าร้าน — build+เทสต์แล้ว แต่ 'สั่งผิดโปรเจค' รอตัดสินใจ keep/revert", status: "review" },
];

// ยังไม่ทำ — Odoo-parity backlog (จาก roadmap.md)
const PLANNED: readonly RoadmapItemDef[] = [
  // P1 — ต่อยอดจากของที่มีโดยตรง
  { key: "expenses", label: "Expenses (ค่าใช้จ่าย)", desc: "เบิกค่าใช้จ่าย→อนุมัติ→ลงบัญชี/จ่าย", status: "planned", tier: "P1" },
  { key: "invoicing-full", label: "Invoicing เต็มรูป", desc: "credit note, recurring, dunning, multi-currency", status: "planned", tier: "P1" },
  { key: "purchase-agreements", label: "Purchase Agreements", desc: "สัญญาซื้อ/ราคาตกลง, blanket order, เทียบราคา", status: "planned", tier: "P1" },
  { key: "inventory-advanced", label: "Inventory ขั้นสูง", desc: "หลาย warehouse, lot/serial, putaway, routes", status: "planned", tier: "P1" },
  { key: "bank-reconciliation", label: "Bank reconciliation", desc: "กระทบยอดธนาคาร, import statement", status: "planned", tier: "P1" },
  // P2 — module ใหม่ ขยายขอบเขต
  { key: "subscriptions", label: "Subscriptions", desc: "ขายแบบ recurring/สมาชิก, ต่ออายุอัตโนมัติ, MRR", status: "planned", tier: "P2" },
  { key: "helpdesk", label: "Helpdesk", desc: "ticket support, SLA, ทีม, knowledge base", status: "planned", tier: "P2" },
  { key: "website-cms", label: "Website / CMS Builder", desc: "สร้างหน้าเว็บ/บล็อก/SEO ต่อยอด Storefront", status: "planned", tier: "P2" },
  { key: "ecommerce-full", label: "eCommerce เต็มรูป", desc: "variants, โปรโมชั่น, ตะกร้าทิ้ง, payment gateway", status: "planned", tier: "P2" },
  { key: "marketing", label: "Email / SMS Marketing", desc: "campaign, mailing list, automation, A/B", status: "planned", tier: "P2" },
  { key: "events", label: "Events", desc: "จัดงาน/ขายบัตร/ลงทะเบียน", status: "planned", tier: "P2" },
  { key: "quality", label: "Quality", desc: "quality check/control point ในการผลิต", status: "planned", tier: "P2" },
  { key: "maintenance", label: "Maintenance", desc: "ซ่อมบำรุงเครื่องจักร, preventive", status: "planned", tier: "P2" },
  // P3 — เฉพาะทาง / หลังสุด
  { key: "recruitment", label: "Recruitment", desc: "สมัครงาน, ขั้นตอนสัมภาษณ์", status: "planned", tier: "P3" },
  { key: "appraisals", label: "Appraisals", desc: "ประเมินผลพนักงาน", status: "planned", tier: "P3" },
  { key: "time-off", label: "Time Off / Attendance", desc: "ลา/ลงเวลา ต่อจาก HR", status: "planned", tier: "P3" },
  { key: "fleet", label: "Fleet", desc: "จัดการยานพาหนะ", status: "planned", tier: "P3" },
  { key: "documents", label: "Documents", desc: "จัดเก็บเอกสาร/workflow", status: "planned", tier: "P3" },
  { key: "sign", label: "Sign", desc: "เซ็นเอกสารดิจิทัล", status: "planned", tier: "P3" },
  { key: "field-service", label: "Field Service", desc: "งานบริการนอกสถานที่", status: "planned", tier: "P3" },
  { key: "studio", label: "Studio", desc: "สร้าง/ปรับ module เองแบบ low-code", status: "planned", tier: "P3" },
];

export const ROADMAP_ITEMS: readonly RoadmapItemDef[] = [...DONE, ...REVIEW, ...PLANNED];

export const ROADMAP_TIERS: readonly RoadmapTier[] = ["P1", "P2", "P3"];

export interface RoadmapSummary {
  total: number;
  done: number;
  review: number;
  planned: number;
  /** %ของ module ที่ทำเสร็จ เทียบทั้งหมด (ปัดเป็นจำนวนเต็ม) */
  donePercent: number;
}

export function roadmapSummary(items: readonly RoadmapItemDef[]): RoadmapSummary {
  const done = items.filter((i) => i.status === "done").length;
  const review = items.filter((i) => i.status === "review").length;
  const planned = items.filter((i) => i.status === "planned").length;
  const total = items.length;
  const donePercent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, review, planned, donePercent };
}

export function plannedByTier(items: readonly RoadmapItemDef[], tier: RoadmapTier): RoadmapItemDef[] {
  return items.filter((i) => i.status === "planned" && i.tier === tier);
}
