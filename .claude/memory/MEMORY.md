# odoo-erp Memory Index

> Active index — โหลดทุก session (ใช้เฉพาะ 200 บรรทัด/25KB แรก) **คุมให้ ≤150 บรรทัด**
> ลิสต์เฉพาะ memory ที่ active · ของที่ retire อยู่ใน `_archive/` (ไม่ลิสต์ที่นี่)
> 🛠 วิธีเพิ่ม/archive/จัดการ ดู [MEMORY-GUIDE.md](MEMORY-GUIDE.md)

## Core (มักเกี่ยวข้องเสมอ)
- [Project Overview](core/project-overview.md) — odoo-erp คืออะไร, stack, โครงสร้าง clean-arch 4 ชั้น, multi-tenant
- [Conventions](core/conventions.md) — กฎที่ล็อก: shopId-scope, money minor units, stock ledger, double-entry, migration, gotchas
- ⭐ [Feature Status](core/feature-status.md) — **"เสร็จหรือยัง"** — 13 modules ที่ build แล้ว + สถานะเทสต์ + known gaps
- ⭐ [Roadmap (Odoo-parity)](core/roadmap.md) — เส้นชัย: module ที่ Odoo มีแต่เรายังไม่ทำ (backlog จัดกลุ่ม + priority)

## Decisions (ADR)
- [0001 Money = integer minor units](decisions/0001-money-integer-minor-units.md) — ทำไมเงินเป็น integer สตางค์ ไม่ใช่ float
- [0002 Stock = append-only ledger](decisions/0002-stock-append-only-ledger.md) — ทำไม on-hand = SUM(stock_moves) ไม่มีคอลัมน์ mutate
- [0003 Double-entry auto-posting](decisions/0003-double-entry-auto-posting.md) — ทำไมทุกเอกสาร post journal entry ที่ balance + idempotent

## Active Modules (spec รายตัว)
- _(ยังไม่มีไฟล์ spec แยก — ภาพรวมทุก module อยู่ใน [feature-status](core/feature-status.md);_
  _สร้าง spec รายตัวด้วย `/new-module` เมื่อต้องลงรายละเอียด · โครงอยู่ที่ [modules/_template.md](modules/_template.md))_

## Working Log
- [Build History (มิ.ย. 2026)](log/2026-06-build-history.md) — ลำดับงานที่ build (Accounting→…→Store-reviews) + caveats ตอน resume

## Archive (Library)
- ดู [_archive/INDEX.md](_archive/INDEX.md) — memory ที่ retire แล้ว (ไม่โหลด แต่ค้น/promote กลับได้)
