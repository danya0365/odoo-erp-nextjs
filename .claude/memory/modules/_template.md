---
name: _template
description: โครง spec ของ ERP module — คัดลอกไฟล์นี้ตอนสร้าง module ใหม่ (หรือใช้ /new-module) · ไฟล์นี้ไม่ถูก recall
metadata:
  type: module
  status: active
  scope: _template
  updated: 2026-06-26
---

# <Module Name>

> mirror Odoo module: <ชื่อ> · สถานะรวมดูที่ [[feature-status]]

## ขอบเขต
<module นี้ทำอะไร, workflow หลัก, อยู่ใน scope ของใคร>

## Schema + migration
- ตารางใหม่: `<table>` (`shopId`, …) · index `(shopId, …)`
- migration: `drizzle/NNNN_*.sql`
- schema file: `src/infrastructure/db/schema/<file>.ts` (+ re-export ใน `index.ts`)

## Repos + use cases
- `I<Name>Repository` → `Drizzle<Name>Repository` (shopId-scoped, mapper) · wire ที่ `di/container.ts`
- use cases: `<Transition>UseCase` (cross-module รับ `I*` ผ่าน constructor — repo ห้ามเรียก repo)

## Domain rules
- pure service / state machine: `src/domain/services/<name>.ts` (+ `.test.ts`)

## Pages
- `app/(shop)/shop/<module>/` — list / new / [id] (reuse `components/ui/`)
- server action: `requireRole` + Zod + PRG redirect (นอก try/catch)

## Tests + สถานะ verify
- unit (service + use case ด้วย fake repo) · integration (CRUD + scope-by-shop + transaction) · e2e (full flow)
- [ ] unit  [ ] integration  [ ] e2e  [ ] build  [ ] lint

## ปม technical ที่ต้องระวัง
- <gotcha เฉพาะ module นี้>
