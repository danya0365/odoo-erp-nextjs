---
name: conventions
description: กฎที่ล็อกของ odoo-erp (architecture, money/qty/stock, accounting, migration, test gotchas) — อ่านก่อนเขียนโค้ดทุก module
metadata:
  type: convention
  status: active
  scope: global
  updated: 2026-06-26
---

# Conventions — กฎที่ห้ามฝ่าฝืน

## Architecture (clean-arch)
- interface ก่อน impl — use case รับ `I*Repository` ผ่าน constructor เท่านั้น
- business logic อยู่ใน **use case** เท่านั้น (ไม่อยู่ใน action/repo/component)
- **repo ห้ามเรียก repo** — cross-module ให้ use case orchestrate (เช่น `DeliverSalesOrderUseCase`
  รับทั้ง `ISalesOrderRepository` + `IStockMoveRepository`)
- wire repo ทุกตัวที่ `src/infrastructure/di/container.ts` ที่เดียว (composition root)
- `"server-only"` ที่หัวไฟล์ทุกไฟล์ที่แตะ DB
- **scope ทุก query ด้วย `shopId`** — ไม่มีข้อยกเว้น (มี integration test กันรั่วข้ามร้าน)

## ตัวเลข (กันพังเรื่องปัดเศษ)
- **เงิน = integer minor units** (สตางค์, scale 100) — ห้าม float; การปัดเศษอยู่ใน `domain/services/money.ts`
  ที่เดียว (`roundHalfUp`, `computeLine`, `sumDocument` — ปัดต่อบรรทัดแล้วรวม) → [[0001-money-integer-minor-units]]
- **จำนวน = integer** scale `QTY_SCALE=1000` (`quantity.ts`)
- **ราคา/ภาษี snapshot ลงบรรทัด** ตอนสร้าง (`unitPrice`, `taxRateBp`) — ไม่อ่านจาก product ซ้ำ

## สต๊อก
- **append-only ledger** `stock_moves` (`qtyDelta` มีเครื่องหมาย); on-hand = `SUM(qtyDelta)` ต่อ product
  — ไม่มีคอลัมน์ on-hand ที่ mutate → [[0002-stock-append-only-ledger]]

## บัญชี
- **double-entry ต้อง balance** เสมอ (`assertBalanced`); auto-post journal entry จาก invoice/bill/payment/pos/payroll
  ผ่าน `postJournalEntry` ที่ **idempotent** (กันโพสต์ซ้ำด้วย `findBySource`) → [[0003-double-entry-auto-posting]]
- ผังบัญชี/journal default อยู่ใน `domain/services/accounting.ts` (`DEFAULT_ACCOUNTS`, `ACCOUNT_CODES`);
  `ensureDefaults` เป็น additive/idempotent (ร้านเก่าได้บัญชีใหม่อัตโนมัติ)

## เอกสาร & เลขที่
- เลขเอกสารจากตาราง `sequences` ต่อ shop — `UPDATE…RETURNING` atomic ในทรานแซกชันเดียวกับการสร้างเอกสาร;
  ออกเลขตอน **confirm** (ไม่ใช่ draft)
- สถานะเอกสารเป็น state machine ใน `domain/services/*-status.ts`; `DocumentStatusBadge` map status→Badge variant

## Migration
- schema ใหม่ → `npm run db:generate` → commit `drizzle/` → `npm run db:migrate` (**ห้าม `db:push` บน prod**)
- **expand-only** — เพิ่มตาราง/คอลัมน์ nullable เท่านั้น (SQLite ALTER จำกัด)
- enum ที่เป็น TS-only (ไม่กระทบ schema) → "No schema changes, nothing to migrate" ปกติ

## Server actions
- `"use server"` + `requireRole` + Zod validate ทุก action
- **PRG (Post-Redirect-Get)** กัน "submit ค้าง": `redirect()` หลัง mutation — และต้องอยู่ **นอก** try/catch
  (NEXT_REDIRECT ห้ามถูก catch)
- client form ใช้ `useActionState`; reset state (เช่น cart) ด้วย keyed remount **ไม่ใช่** useEffect
  (ผิด ESLint `react-hooks/set-state-in-effect`)

## Test gotchas (เจอจริง — กันเสียเวลาซ้ำ)
- Playwright `getByRole/getByLabel` match แบบ **substring + case-insensitive** → ชื่อที่เป็น subset ชนกัน
  (เช่น "ปิดกะ" ⊂ "เปิดกะ", "ชื่อ" ⊂ "ชื่อของคุณ") → ใช้ `{ exact: true }` หรือเปลี่ยนชื่อ
- `aria-label` บน control override label ที่ผูกไว้; required field ใส่ `*` ในชื่อ accessible
  → `getByLabel(exact:true)` พังถ้า input required ไม่มี aria-label
- e2e ใช้ `local.db` แบบ persistent (accumulate) → ใส่ random suffix ต่อ test กันชนกัน
- integration: `withTestDb` (temp libSQL) + `seedShop`; รันด้วย `NODE_OPTIONS=--conditions=react-server`

## UI
- ใช้ token utility เท่านั้น + reuse `components/ui/` เดิม (Table/Pagination/Tabs/Badge/FormField/Modal/Toast/Alert/Card…)
