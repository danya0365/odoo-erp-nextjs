---
name: 2026-06-build-history
description: ลำดับงานที่ build ในช่วง มิ.ย. 2026 (Accounting→…→Store-reviews) + caveats สำหรับ resume — อ่านตอนต่องานเก่า
metadata:
  type: log
  status: active
  scope: global
  updated: 2026-06-26
---

# Build History — มิ.ย. 2026

## ก่อนหน้า session นี้
- รากฐานเสร็จ: theme/UI, clean-arch 4 ชั้น, auth multi-tenant, migration harness (zero-downtime audit/build)
- Core Commerce ครบ: **Contacts → Inventory → Sales → Purchase** (ตามแผนเดิม `delightful-tome`)

## Session นี้ (build ต่อเป็น vertical slice ทีละตัว เทสต์ครบก่อนไปต่อ)
ลำดับ: **Accounting → CRM → Reporting → Inventory-advanced → POS → Manufacturing → HR/Payroll → Storefront → Project/Timesheet**
- migration ที่เพิ่ม: 0006 (accounting), 0007 (crm), 0008 (reorder_rules), 0009 (pos), 0010 (manufacturing),
  0011 (hr), 0012 (online_orders), 0013 (projects), 0014 (store_reviews)
- จบ session: Unit/Integration/E2E เขียวหมด, lint 0 error (เหลือ 1 warning เก่าใน `.agents/skills/...`), build ผ่าน

## Store-reviews (Phase 14) — "สั่งผิดโปรเจค"
- พี่รายงานบั๊ก "ลูกค้ากด submit รีวิวแล้วค้าง แต่ refresh เห็นข้อมูลแล้ว" → สืบแล้ว **ไม่มี feature รีวิวอยู่จริง**
  (storefront checkout วัดใน prod build 49–57ms ไม่ค้าง) → จึง build feature รีวิวด้วย PRG redirect กัน submit ค้าง
- ต่อมาพี่แจ้งว่า **"สั่งผิดโปรเจค"** — รีวิวไม่ได้ตั้งใจให้โปรเจคนี้ · พี่สั่ง **"ยังไม่ต้องทำอะไร"**
- ⇒ store-reviews ยังอยู่ในโค้ด (build+เทสต์เขียว) **รอตัดสินใจ keep/revert** (ดู gap ใน [[feature-status]])

## Caveats ที่เจอ (สรุป — รายละเอียดกฎอยู่ใน [[conventions]])
- Playwright label/role match แบบ substring → ชื่อ subset ชนกัน (แก้ด้วย `exact:true` / เปลี่ยนชื่อ;
  เคยเปลี่ยน checkout label "ชื่อ"→"ชื่อผู้สั่งซื้อ" กันชนกับ "ชื่อของคุณ" ของฟอร์มรีวิว)
- POS cart reset ต้องใช้ keyed remount ไม่ใช่ useEffect (ESLint `react-hooks/set-state-in-effect`)
- เพิ่ม source type ใหม่ต้องเติม key ใน `journalTypeForSource` (ไม่งั้น TS error)
- e2e ใช้ local.db persistent → ใส่ random suffix ต่อ test

## งานล่าสุด (session ปัจจุบัน 2026-06-26)
- ตั้งระบบ memory แบบ portable เข้า repo (`.claude/`) เลียนแบบ easy-game-arena: settings (`autoMemoryDirectory`),
  hooks (format/commit-reminder), slash commands, และ memory content ทั้งหมดนี้ (รวม feature-status + roadmap)
