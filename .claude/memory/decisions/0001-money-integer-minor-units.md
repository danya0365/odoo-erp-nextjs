---
name: 0001-money-integer-minor-units
description: ทำไมเงินเก็บเป็น integer minor units (สตางค์) ไม่ใช่ float — อ่านก่อนแตะ money/ราคา/ภาษี/totals
metadata:
  type: decision
  status: active
  scope: global
  updated: 2026-06-26
---

# ADR 0001 — เงิน = integer minor units

## บริบท
ERP คำนวณเงินเยอะ (ราคา × จำนวน, ภาษี, ส่วนลด, รวมเอกสาร, บัญชี double-entry) ·
float มี error สะสมและปัดเศษไม่นิ่ง → ยอดไม่ balance, รายงานเพี้ยน

## การตัดสินใจ
- เก็บเงินเป็น **integer minor units** (สตางค์, scale 100) ทุกที่ + คอลัมน์ `currency` ต่อเอกสาร
- การปัดเศษรวมศูนย์ที่ `src/domain/services/money.ts` ที่เดียว: `roundHalfUp`, `computeLine`, `sumDocument`
- **ปัดต่อบรรทัดก่อนแล้วค่อยรวม** (round-per-line) — ให้ตรงกับที่ Odoo/ใบกำกับภาษีแสดง
- ราคา/ภาษี **snapshot ลงบรรทัด** ตอนสร้าง (`unitPrice`, `taxRateBp`) ไม่อ่านจาก product ซ้ำ

## เหตุผล
- integer = exact ไม่มี float drift; เทสต์ปัดเศษได้ deterministic (half-up, multi-line)
- รวมตรรกะที่เดียว → แก้/ตรวจง่าย, ทุก module ใช้เหมือนกัน

## ผลที่ตามมา / ข้อควรระวัง
- ต้อง parse/format ผ่าน helper เสมอ (`parseScaled`/`formatScaled`) — ห้ามคำนวณเงินด้วย Number ตรงๆ
- จำนวน (qty) ก็ใช้หลักเดียวกันแต่ scale `QTY_SCALE=1000`
- ถ้าจะรองรับ multi-currency เต็มรูป (อัตราแลกเปลี่ยน) ต้องเพิ่ม rate snapshot — ยังไม่ทำ (อยู่ roadmap)
