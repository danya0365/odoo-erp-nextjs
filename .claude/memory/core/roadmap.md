---
name: roadmap
description: เส้นชัยแบบ Odoo-parity — module ที่ Odoo มีแต่ odoo-erp ยังไม่ทำ จัดกลุ่ม+priority · อ่านตอนถามว่า "ทำอะไรต่อ"
metadata:
  type: overview
  status: active
  scope: global
  updated: 2026-06-26
---

# Roadmap — สู่ Odoo-parity

> สิ่งที่ build แล้ว → [[feature-status]] · ไฟล์นี้ลิสต์เฉพาะ **ที่ยังไม่ทำ** เป็นเส้นชัย
> เมื่อ build module ไหนเสร็จ → ย้ายออกจากที่นี่ ไปขึ้นตารางใน feature-status
> Priority: **P1** ต่อยอดจากของที่มี/คุ้มสุด · **P2** ขยายขอบเขต · **P3** เฉพาะทาง/หลังสุด
> 🔎 **Gap backlog เชิง flow:** หน้า `/shop/journey/coverage` รวมฟีเจอร์ที่ขาดจาก **real-world journeys**
> (ขับเคลื่อนจาก `src/domain/services/journeys.ts`) — เป็นมุม "สถานการณ์จริงต้องมีอะไร" เสริมกับ Odoo-parity ด้านล่าง
> เช่น RMA/ใบลดหนี้, มัดจำ/ผ่อน, โปร/แต้ม, AR aging/dunning, ภพ.30, กระทบยอดธนาคาร, stocktake, lot/expiry,
> purchase return/QC, ลา/OT, เบิกค่าใช้จ่าย, service ticket

## P1 — ต่อยอดจาก module ปัจจุบันโดยตรง
| Module (Odoo) | ทำอะไร | พึ่งพา/ต่อยอดจาก |
|---------------|--------|------------------|
| **Expenses** | พนักงานเบิกค่าใช้จ่าย → อนุมัติ → ลงบัญชี/จ่าย | HR, Accounting |
| **Invoicing เต็มรูป** | credit note, recurring invoice, dunning, multi-currency | Sales, Accounting |
| **Purchase Agreements** | สัญญาซื้อ/ราคาตกลง, blanket order, RFQ หลายเจ้าเทียบราคา | Purchase |
| **Inventory ขั้นสูง** | หลาย warehouse, lot/serial tracking, putaway, reordering routes | Inventory |
| **Bank reconciliation** | กระทบยอดธนาคาร, statement import | Accounting |

## P2 — module ใหม่ (ขยายขอบเขตธุรกิจ)
| Module (Odoo) | ทำอะไร |
|---------------|--------|
| **Subscriptions** | ขายแบบ recurring/สมาชิก, ต่ออายุอัตโนมัติ, MRR |
| **Helpdesk** | ticket support, SLA, ทีม, knowledge base |
| **Website / CMS Builder** | สร้างหน้าเว็บ/บล็อก/SEO ต่อยอดจาก Storefront |
| **eCommerce เต็มรูป** | catalog variants, โปรโมชั่น, ตะกร้าทิ้ง, payment gateway |
| **Email / SMS Marketing** | campaign, mailing list, automation, A/B |
| **Events** | จัดงาน/ขายบัตร/ลงทะเบียน |
| **Quality** | quality check/control point ในการผลิต (ต่อจาก Manufacturing) |
| **Maintenance** | ซ่อมบำรุงเครื่องจักร, preventive |

## P3 — เฉพาะทาง / หลังสุด
| Module (Odoo) | ทำอะไร |
|---------------|--------|
| **Recruitment** | สมัครงาน, ขั้นตอนสัมภาษณ์ (ต่อจาก HR) |
| **Appraisals** | ประเมินผลพนักงาน |
| **Time Off / Attendance** | ลา/ลงเวลา (ต่อจาก HR) |
| **Fleet** | จัดการยานพาหนะ |
| **Documents** | จัดเก็บเอกสาร/workflow |
| **Sign** | เซ็นเอกสารดิจิทัล |
| **Field Service** | งานบริการนอกสถานที่ |
| **Studio** | สร้าง/ปรับ module เองแบบ low-code (งานใหญ่/หลังสุด) |

## หมายเหตุการตัดสินใจ
- ยังไม่มี "เส้นชัยตายตัว" — Odoo มี ~50+ apps; ไม่จำเป็นต้องทำครบ
- เลือก module ถัดไปตามความต้องการจริงของพี่ + ต่อยอดสิ่งที่มี (P1 คุ้มสุด)
- ทุก module ใหม่ทำตาม per-module pattern + เทสต์ครบ 3 ชั้น (ดู [[conventions]]) และเริ่มด้วย `/new-module`
