---
description: สร้าง memory spec ของ ERP module ใหม่ใน odoo-erp
argument-hint: "[ชื่อ module เช่น expenses, helpdesk]"
---

สร้าง memory spec สำหรับ ERP module ใหม่ตาม convention ใน `.claude/memory/MEMORY-GUIDE.md`
ชื่อ module: **$ARGUMENTS**

ทำตามขั้นตอนนี้:

1. แปลงชื่อเป็น kebab-case → สร้างไฟล์ `.claude/memory/modules/<slug>.md`
   (ใช้ `.claude/memory/modules/_template.md` เป็นโครง)
2. frontmatter มาตรฐาน (`type: module`, `status: active`, `scope: <slug>`, `updated` = วันนี้)
3. โครงเนื้อหา spec (เว้นที่ให้เติม):
   - **ขอบเขต** — module นี้ทำอะไร, mirror Odoo module ไหน
   - **Schema + migration** — ตารางใหม่, index, เลข migration
   - **Repos + use cases** — `I*Repository` + use case ต่อ transition (cross-module ผ่าน constructor)
   - **Domain rules** — pure service / state machine ถ้ามี
   - **Pages** — route ใต้ `app/(shop)/shop/<module>/`
   - **Tests + สถานะ verify** — unit / integration (scope-by-shop) / e2e
   - **ปม technical ที่ต้องระวัง**
   - ถ้ายังไม่รู้รายละเอียด ให้ถามทีละจุด หรือใส่ TODO ไว้
4. เพิ่ม pointer ใน section "Active Modules" ของ `.claude/memory/MEMORY.md`
5. อัปเดต `core/feature-status.md` (เพิ่มแถว module นี้) และถ้าเคยอยู่ใน `core/roadmap.md` ให้ย้ายออกจาก backlog
6. (ถ้าเริ่ม coding แล้ว) เสนอว่าจะ scaffold โครงโค้ดตาม per-module pattern ต่อเลยไหม
