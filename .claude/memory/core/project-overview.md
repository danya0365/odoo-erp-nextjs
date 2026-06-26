---
name: project-overview
description: odoo-erp คืออะไร, tech stack, โครงสร้าง clean-arch 4 ชั้น, multi-tenant — อ่านตอนเริ่มทำความเข้าใจโปรเจค
metadata:
  type: overview
  status: active
  scope: global
  updated: 2026-06-26
---

# odoo-erp — ภาพรวม

ERP แบบ Odoo **multi-tenant** (หลายร้านบนระบบเดียว) บน Next.js — เลียนแบบ workflow และ module ของ Odoo
(quotation→order→delivery→invoice→payment, RFQ→PO→receipt→bill, บัญชี double-entry, POS, MRP, HR ฯลฯ)

## Tech stack
- **Next.js 16** (App Router, React 19, TypeScript strict) — ⚠️ มี breaking changes จาก Next ที่คุ้นเคย
  (middleware ถูก rename เป็น `proxy.ts`, `params`/`searchParams` เป็น Promise) — **อ่าน `node_modules/next/dist/docs/` ก่อนเขียนโค้ดเสมอ** (ดู `AGENTS.md`)
- **Tailwind v4** — ใช้ token utility + reuse component ใน `src/presentation/components/ui/`
- **Drizzle ORM + @libsql/client** (dialect `turso`, casing `snake_case`, local `file:./local.db`)
- เทสต์: `tsx --test` (unit), libSQL ชั่วคราว (integration), Playwright พอร์ต 3100 (e2e)

## Clean Architecture 4 ชั้น
1. **domain** — pure (entities + services เช่น `money.ts`, state machines) ไม่แตะ I/O
2. **application** — `I*Repository` (interface) + use cases (business logic อยู่ที่นี่ที่เดียว)
3. **infrastructure** — Drizzle repo (impl), DI container (`src/infrastructure/di/container.ts` = composition root ที่เดียว)
4. **presentation** — server components (pages), server actions, client components

กฎเหล็ก: use case เห็นแค่ `I*` · repo **ห้ามเรียก** repo (cross-module orchestrate ใน use case ผ่าน constructor) ·
wire ทุก repo ที่ `container.ts` ที่เดียว · `"server-only"` ทุกไฟล์ที่แตะ DB · scope ทุก query ด้วย `shopId`
(รายละเอียดกฎทั้งหมด → [[conventions]])

## Multi-tenant
- ทุกตารางมี `shopId`; ทุก query/CRUD scope ด้วย `shopId` (integration test มี "scope-by-shop ไม่รั่ว" เป็น critical)
- auth: `requireRole()` + scope ใน server action; route group `(shop)`/`(staff)`/`(platform)` gate ด้วย `proxy.ts`
- `/store/[slug]` = หน้าร้าน public (ไม่ต้องล็อกอิน)

## Route groups (app/)
`(auth)/login` · `(platform)/admin` · `(shop)/shop/<module>` (back-office) · `(staff)/staff` · `store/[slug]` (public storefront)

## สถานะปัจจุบัน
ดู [[feature-status]] (อะไรเสร็จแล้ว) และ [[roadmap]] (อะไรยังไม่ทำ)
