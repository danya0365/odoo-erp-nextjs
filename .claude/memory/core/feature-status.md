---
name: feature-status
description: แหล่งความจริงเรื่อง "เสร็จหรือยัง" — ตาราง module ที่ build แล้ว + สถานะเทสต์ + known gaps · อัปเดตทุกครั้งที่ build/เปลี่ยนสถานะ
metadata:
  type: overview
  status: active
  scope: global
  updated: 2026-06-26
---

# Feature Status — odoo-erp

> ภาพรวม ณ 2026-06-26 · นับจริงจากโค้ด: **16 migrations** (`drizzle/0000`–`0015`) ·
> build + lint เขียว · เส้นชัยที่ยังเหลือ (module ที่ Odoo มีแต่เรายังไม่ทำ) → [[roadmap]]

## ไล่เก็บ journey (สร้างฟีเจอร์ที่ขาดทีละอัน)
- ✅ **#1 sales-return (RMA)** — คืนสินค้า/ใบลดหนี้/คืนเงิน ครบวงจร (migration 0015 `sales_returns`):
  CreateSalesReturn → ConfirmSalesReturn (stock IN `sales_return`) → PostCreditNote (DR รายได้+ภาษีขาย/CR ลูกหนี้) →
  RefundSalesReturn (payment outbound) → PostRefund (DR ลูกหนี้/CR เงินสด) · `creditNoteEntryLines`+`customerRefundEntryLines`
  ใน accounting.ts · หน้า `/shop/sales/returns` · journey `sales-return` = 100% done · เทสครบ 3 ชั้น
- ✅ **#2 vat-filing (ภพ.30)** — รายงานภาษีขาย-ซื้อต่องวด + บันทึกการยื่น (migration 0016 `vat_filings`):
  `tax.ts` (vatSummary/monthRange), GetVatReport (จาก trialBalance ตามช่วงเดือน), FileVatReturn (กันยื่นซ้ำ) ·
  หน้า `/shop/accounting/vat` · journey `vat-filing` = done · เทสครบ 3 ชั้น
- ✅ **#3 stocktake (ตรวจนับสต๊อก)** — เปิดรอบนับ (snapshot on-hand) → กรอกยอดนับ → ปรับตามส่วนต่าง
  (migration 0017 `stock_counts`): CreateStockCount/ApplyStockCount (sourceType `stocktake`) · หน้า `/shop/inventory/stocktake` · done
- ✅ **#4 purchase-return-qc (คืนของผู้ขาย)** — คืนของจากใบตั้งหนี้ + QC → stock OUT + ใบลดหนี้ผู้ขาย
  (migration 0018 `purchase_returns`): CreatePurchaseReturn/ConfirmPurchaseReturn + PostVendorCredit
  (`vendorCreditNoteEntryLines` DR เจ้าหนี้/CR ค่าใช้จ่าย+ภาษีซื้อ) · หน้า `/shop/purchase/returns` · done
- ✅ **#5 credit-collection (อายุลูกหนี้/ทวงหนี้)** — เครดิตเทอม (partner.creditTermDays) + AR aging report
  (`ar-aging.ts` summarizeAging) + บันทึกการทวง (migration 0019: partners.credit_term_days + `dunning_logs`):
  GetArAging/RecordDunning · หน้า `/shop/accounting/receivables` · done
- เลือก journey ถัดไปจาก Gap backlog (`/shop/journey/coverage`) — กำลังไล่ทำต่อเนื่อง (autonomous)

## Legend
✅ เสร็จ+เทสต์ครบ 3 ชั้น · 🟡 ใช้ได้แต่มี gap/รอตัดสินใจ · ⬜ ยังไม่เริ่ม (อยู่ใน roadmap)

## Modules ที่ build แล้ว (vertical slice ครบทุกตัว)

| # | Module | Route | Migration | Unit | Int | E2E | สถานะ |
|---|--------|-------|-----------|:---:|:---:|:---:|:---:|
| 1 | **Contacts** (partners) | `/shop/contacts` | 0000–0005 | ✅ | ✅ | `contacts` | ✅ |
| 2 | **Inventory** (products, locations, stock_moves) | `/shop/products`, `/shop/inventory` | 0000–0005 | ✅ | ✅ | `inventory` | ✅ |
| 3 | **Inventory advanced** (reorder rules, transfer) | `/shop/inventory/reorder`, `/transfer` | 0008 | ✅ | ✅ | `inventory-advanced` | ✅ |
| 4 | **Sales** (quotation→order→deliver→invoice→pay) | `/shop/sales` | 0000–0005 | ✅ | ✅ | `sales` | ✅ |
| 5 | **Purchase** (RFQ→PO→receive→bill→pay) | `/shop/purchase` | 0000–0005 | ✅ | ✅ | `purchase` | ✅ |
| 6 | **Accounting** (double-entry, journals, trial balance) | `/shop/accounting` | 0006 | ✅ | ✅ | `accounting` | ✅ |
| 7 | **CRM** (pipeline, opportunities, stages) | `/shop/crm` | 0007 | ✅ | ✅ | `crm` | ✅ |
| 8 | **Reporting/Dashboard** (sales + inventory reports) | `/shop/reports` | — (อ่านข้อมูลเดิม) | ✅ | ✅ | `reports` | ✅ |
| 9 | **POS** (sessions, orders, cash sale→journal) | `/shop/pos` | 0009 | ✅ | ✅ | `pos` | ✅ |
| 10 | **Manufacturing** (BOM, manufacturing orders) | `/shop/manufacturing` | 0010 | ✅ | ✅ | `manufacturing` | ✅ |
| 11 | **HR / Payroll** (employees, payroll run→journal) | `/shop/hr` | 0011 | ✅ | ✅ | `hr` | ✅ |
| 12 | **Storefront** (online orders, public store) | `/store/[slug]`, `/shop/storefront` | 0012 | ✅ | ✅ | `storefront` | ✅ |
| 13 | **Project / Timesheet** | `/shop/projects` | 0013 | ✅ | ✅ | `projects` | ✅ |

## Known gaps / รอตัดสินใจ

- 🟡 **Store-reviews** (มี schema 0014, `review.ts`, `SubmitReviewUseCase`, `ReviewForm`, เทสต์ `store-review`)
  — feature นี้ "สั่งผิดโปรเจค" (พี่แจ้งว่าไม่ได้ตั้งใจให้โปรเจคนี้) แต่ build + เทสต์เขียวแล้ว ·
  **สถานะ: คงไว้ก่อน รอพี่ตัดสินใจ keep / revert** (พี่บอก "ยังไม่ต้องทำอะไร")
- โครงสร้างฐาน (auth multi-tenant, theme/UI, sequences, migration harness) = เสร็จก่อนหน้า session นี้

## "เสร็จทุกฟีเจอร์แล้วหรือยัง?" — สรุป
- **เทียบกับแผนเดิม (Core Commerce: Contacts→Inventory→Sales→Purchase): เสร็จครบ + เกินแผนไปมาก**
- **เทียบกับ Odoo เต็มรูปแบบ: ยังไม่ครบ** — มี backlog ตาม [[roadmap]] (Expenses, Subscriptions,
  Marketing, Helpdesk, Website/CMS, ฯลฯ) · ยังไม่มีเส้นชัยตายตัว ใช้ roadmap เป็นตัววัด

> วิธีเช็คความสดของตารางนี้: `/memory-status` (เทียบจำนวน migration/เทสต์จริงกับที่จดไว้)

## หน้าเว็บ Roadmap (ในแอป)
มีหน้า `/shop/roadmap` (back-office, shop_owner) ที่แสดงสถานะนี้แบบ visual ·
**ข้อมูลขับเคลื่อนจาก `src/domain/services/roadmap-status.ts`** (`ROADMAP_ITEMS`) — **อัปเดตคู่กับไฟล์นี้และ [[roadmap]]**
เมื่อ build module ใหม่/เปลี่ยนสถานะ (page: `app/(shop)/shop/roadmap/page.tsx`, unit test: `roadmap-status.test.ts`, e2e: `roadmap.spec.ts`)

## หน้าเว็บ User Journey + Coverage (ในแอป)
มีหน้า `/shop/journey` (เดินดู flow จริงครบวงจร, ลิงก์ step ไปหน้าจริง) + `/shop/journey/coverage`
(map แต่ละ step → URL จริง + สถานะ มีแล้ว/บางส่วน/ยังไม่มี) · **ข้อมูลที่ `src/domain/services/journeys.ts`** (`JOURNEYS`)
— อัปเดต `status` ของ step เมื่อเทส journey นั้นจริง · มี 2 ประเภท (`kind`):
- **supported (12)** — flow ที่ระบบรองรับแล้ว (order-to-cash, procure-to-pay, online-store, pos-shift,
  lead-to-order, make-to-stock, auto-replenish, stock-transfer, hire-to-payroll, project-delivery,
  record-to-report, business-overview)
- **real-world (12)** — สถานการณ์จริงที่ยัง **ขาดฟีเจอร์** (gap-driven): sales-return(RMA/ใบลดหนี้),
  deposit-installment, promotion-loyalty, credit-collection(AR aging/dunning), vat-filing(ภพ.30),
  bank-recon-close, stocktake, lot-expiry(FEFO), purchase-return-qc, leave-attendance, expense-claim,
  service-ticket · step `missing`/`partial` = **ไอเดียฟีเจอร์ที่ต้องทำ**

หน้า `/shop/journey/coverage` มี **Gap backlog** (จาก `gapBacklog()`) รวมฟีเจอร์ที่ขาดทั้งหมด → ใช้เป็น roadmap
ลงมือทำทีละอัน (โยงกับ [[roadmap]]) · unit: `journeys.test.ts`, e2e: `journey.spec.ts`
