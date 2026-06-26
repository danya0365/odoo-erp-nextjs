---
name: memory-guide
description: คู่มือ convention + lifecycle ของระบบ memory odoo-erp (อ่านก่อนเขียน/ย้าย/archive memory ทุกครั้ง) — ไฟล์นี้ไม่ถูกโหลดอัตโนมัติ
metadata:
  type: convention
  status: active
  scope: global
  updated: 2026-06-26
---

# odoo-erp Memory — คู่มือ & Lifecycle

ระบบนี้สร้างทับกลไก auto-memory ของ Claude Code (`autoMemoryDirectory` ใน `.claude/settings.json`
ชี้มาที่โฟลเดอร์นี้) เพื่อให้ memory **อยู่ใน repo / commit ขึ้น git / คนอ่านได้** และ **context ไม่บวม**
แม้ memory จะโตเป็นหลายร้อยไฟล์ ก็ต้องทำตามคู่มือนี้ทุกครั้งที่จัดการ memory

## หลักการ (ทำไมไม่บวม)
- **เฉพาะ `MEMORY.md` ที่โหลดทุก session** (200 บรรทัด/25KB แรก) → คุมให้ **≤150 บรรทัด**
- Topic files **ไม่โหลดตอนเริ่ม** — เปิดอ่าน on-demand เมื่อ description ใน index ชี้ว่าเกี่ยว
- ไฟล์ที่ **ไม่อยู่ใน `MEMORY.md` = ไม่ recall อัตโนมัติ แต่เปิดอ่านได้** → กลไก "library"

## โครงสร้างโฟลเดอร์
| โฟลเดอร์ | เก็บอะไร |
|----------|----------|
| `core/` | ความรู้แกนถาวร: project-overview, conventions, **feature-status**, **roadmap** |
| `decisions/` | ADR — 1 ไฟล์ = 1 การตัดสินใจ ตั้งชื่อ `NNNN-title.md` (เลขรันต่อ) |
| `modules/` | spec ต่อ ERP module (1 ไฟล์ = 1 module) — สร้าง on-demand ด้วย `/new-module` |
| `log/` | working log/progress — เก็บล่าสุดที่ active, เก่าย้าย `_archive/` |
| `_archive/` | library/cold storage — **ไม่ลิสต์ใน MEMORY.md** มี `INDEX.md` เป็น catalog |

## Frontmatter มาตรฐาน (ทุก topic file)
```yaml
---
name: <slug-kebab-case>
description: <1 บรรทัด ช่วยตัดสินใจ recall — บอกว่า "อ่านเมื่อ...">
metadata:
  type: overview | convention | decision | module | log
  status: active | archived
  scope: <ชื่อ module หรือ global>
  updated: YYYY-MM-DD
---
```
- เชื่อม memory ที่เกี่ยวกันใน body ด้วย `[[name]]`
- `description` สำคัญสุด — recall ไม่ใช่ semantic อัตโนมัติ ต้องเลือกเปิดจาก description ใน index

## Lifecycle

### เพิ่ม memory ใหม่
1. เขียน topic file ในโฟลเดอร์ที่ตรงประเภท พร้อม frontmatter ครบ
2. เพิ่ม pointer 1 บรรทัดใน `MEMORY.md` section ที่ตรง: `- [Title](path) — description สั้น`
3. ถ้าเป็นการตัดสินใจสำคัญ → สร้าง ADR ใน `decisions/` ด้วย (`/new-adr`)

### คุมขนาด index
- ถ้า `MEMORY.md` ใกล้ ~150 บรรทัด → archive ของที่ไม่ active ออกก่อน หรือยุบ pointer ที่ซ้ำซ้อน
- เตือนพี่เมื่อ index ใกล้เต็ม (รัน `/memory-status` เช็คได้)

### Archive (ย้ายเข้า library) — `/archive-memory <path>`
1. `git mv` ไฟล์ → `_archive/`
2. แก้ frontmatter `status: archived`
3. ลบ pointer ออกจาก `MEMORY.md`
4. เพิ่ม 1 แถวใน `_archive/INDEX.md`: ชื่อไฟล์ · เหตุผล · วันที่

### Promote กลับ
1. `git mv` ไฟล์ออกจาก `_archive/` กลับโฟลเดอร์เดิม
2. แก้ frontmatter `status: active`
3. คืน pointer ใน `MEMORY.md`
4. ลบแถวออกจาก `_archive/INDEX.md`

### เกณฑ์ตัดสิน archive
- ไม่ถูกอ้างอิง/แตะนานหลายเดือน **หรือ** ถูกแทนที่/ลบจริง
- ADR ที่ถูก supersede → ไม่ลบ แต่ archive + ชี้ ADR ใหม่ที่แทน

## กฎเฉพาะของโปรเจคนี้
- **`feature-status.md` คือแหล่งความจริงเรื่อง "เสร็จหรือยัง"** — ทุกครั้งที่ build module เสร็จ
  หรือเปลี่ยนสถานะ ต้องอัปเดตตารางนี้ (และ `/new-module` ทำให้อัตโนมัติ)
- **`roadmap.md` = เส้นชัยแบบ Odoo-parity** — module ที่ build แล้วต้องย้ายออกจาก backlog
- ห้ามบันทึกสิ่งที่ repo บอกอยู่แล้ว (โครงโค้ด, git history) — บันทึกเฉพาะ "ทำไม" + สถานะ + caveats
