---
description: รายงานสุขภาพระบบ memory ของ odoo-erp (ขนาด index, จำนวนไฟล์, archive)
---

ตรวจสุขภาพระบบ memory แล้วรายงานสั้นๆ:

1. นับจำนวนบรรทัดของ `.claude/memory/MEMORY.md` — **เตือนถ้าเกิน ~150 บรรทัด**
   (budget จริงคือ 200 บรรทัด/25KB; เกินแล้วจะกิน context ฟรี) พร้อมแนะนำว่าควร archive อะไร
2. ลิสต์จำนวนไฟล์ active แยกตามโฟลเดอร์ (`core/`, `decisions/`, `modules/`, `log/`)
3. ลิสต์รายการใน `.claude/memory/_archive/INDEX.md` (ของที่ retire แล้ว)
4. ชี้ความไม่สอดคล้อง (ถ้ามี): ไฟล์ที่ไม่มี pointer ใน MEMORY.md, pointer ที่ชี้ไฟล์หาย,
   frontmatter ขาด field, `status` ไม่ตรงตำแหน่ง (active แต่อยู่ใน `_archive/` หรือกลับกัน)
5. เทียบ `core/feature-status.md` กับสภาพจริงของโค้ด (จำนวน migration ใน `drizzle/`, จำนวนเทสต์)
   — เตือนถ้าตารางสถานะล้าสมัย
6. สรุปเป็น checklist สั้นๆ ว่ามีอะไรควรจัดการไหม
