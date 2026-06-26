---
name: 0003-double-entry-auto-posting
description: ทำไมทุกเอกสาร auto-post journal entry ที่ balance + idempotent — อ่านก่อนแตะ accounting/invoice/bill/payment/pos/payroll posting
metadata:
  type: decision
  status: active
  scope: global
  updated: 2026-06-26
---

# ADR 0003 — Double-entry auto-posting (idempotent)

## บริบท
บัญชีต้อง double-entry (เดบิต=เครดิตเสมอ) และต้องสะท้อนเอกสารจริงจากหลาย module
(invoice ลูกค้า, vendor bill, payment, POS cash sale, payroll) · ถ้าให้คนลง manual จะพลาด/ไม่ balance/ลงซ้ำ

## การตัดสินใจ
- ทุกเอกสารที่กระทบบัญชี **auto-post journal entry** ผ่าน `postJournalEntry` (use case helper)
- entry ต้อง **balance** — บังคับด้วย `assertBalanced` (จาก `domain/services/accounting.ts`) ก่อนเขียน
- **idempotent** — กันโพสต์ซ้ำด้วย `findBySource(sourceType, sourceId)` ก่อนสร้าง
- map เอกสาร→ประเภท journal ด้วย `journalTypeForSource` (invoice→sale, bill→purchase, payment→bank, pos→sale, payroll→general)
- ผังบัญชี default (`DEFAULT_ACCOUNTS`, `ACCOUNT_CODES`) + journal default รวมศูนย์ใน `accounting.ts`;
  `ensureDefaults` additive/idempotent (ร้านเก่าได้บัญชีใหม่)

## เหตุผล
- บัญชีถูกต้องอัตโนมัติ, audit ได้, ไม่มี entry ลอย/ไม่ balance
- idempotent → retry/post ซ้ำปลอดภัย (เช่น action ถูกกดซ้ำ)

## ผลที่ตามมา / ข้อควรระวัง
- ทุก source type ใหม่ต้องเพิ่ม key ใน `journalTypeForSource` (ไม่งั้น TS error — เคยเจอตอนเพิ่ม "pos")
- เพิ่มบัญชีใหม่ → เติมใน `DEFAULT_ACCOUNTS` (additive) ไม่ใช่แก้ของเดิม
- entry lines builder แยกต่อชนิดเอกสาร (`invoiceEntryLines`, `billEntryLines`, `paymentEntryLines`,
  `cashSaleEntryLines`, `payrollEntryLines`) — เพิ่มเอกสารใหม่ให้ทำ builder ใหม่
