---
name: 0002-stock-append-only-ledger
description: ทำไมสต๊อกเป็น append-only ledger (on-hand = SUM(stock_moves)) ไม่มีคอลัมน์ mutate — อ่านก่อนแตะ stock/inventory/delivery/receipt
metadata:
  type: decision
  status: active
  scope: global
  updated: 2026-06-26
---

# ADR 0002 — สต๊อก = append-only ledger

## บริบท
หลาย module ขยับสต๊อก (Sales deliver = OUT, Purchase receive = IN, POS, Manufacturing, adjust, transfer) ·
ถ้าเก็บ on-hand เป็นคอลัมน์เดียวแล้ว mutate → race condition, audit ไม่ได้, ย้อนดูประวัติไม่ได้

## การตัดสินใจ
- ตาราง `stock_moves` แบบ **append-only**: `productId`, `locationId`, `qtyDelta` (มีเครื่องหมาย),
  `type` (in/out/adjust/transfer), `sourceType`, `sourceId`
- **on-hand = `SUM(qtyDelta)`** ต่อ product (ไม่มีคอลัมน์ on-hand ที่แก้ค่า)
- repo มี `appendMany`, `onHandByProduct`, `onHandList`; index `(shopId, productId)`
- การขยับสต๊อกข้าม module อยู่ใน use case (เช่น `DeliverSalesOrderUseCase` รับ `IStockMoveRepository`)

## เหตุผล
- ledger = source of truth, audit ครบ, ไม่มี lost-update
- คำนวณ on-hand จาก SUM พอสำหรับ MVP (มี index รองรับ)

## ผลที่ตามมา / ข้อควรระวัง
- อ่าน on-hand เป็น aggregate query — ถ้าโตมากค่อยทำ cache table (expand-only ได้)
- ห้าม "อัปเดต" move เดิม — แก้ด้วยการ append move ใหม่ (เช่น ปรับสต๊อก/คืนของ)
- location default เดียวต่อ shop ใน MVP; multi-warehouse อยู่ใน [[roadmap]]
