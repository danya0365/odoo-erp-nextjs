import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("รายงาน: ขายจริงแล้วเห็นในภาพรวม + สินค้าขายดี + มูลค่าสต๊อก", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const customer = `ลูกค้ารายงาน ${s}`;
  const sku = `RPT-${s}`;
  const productName = `สินค้ารายงาน ${s}`;

  await loginAsOwner(page);

  // ลูกค้า + สินค้า (ทุน 50 / ขาย 100) + เติมสต๊อก 20
  await page.goto("/shop/contacts/new");
  await page.getByLabel("ชื่อ").fill(customer);
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/contacts$/);

  await page.goto("/shop/products/new");
  await page.getByLabel("รหัสสินค้า (SKU)").fill(sku);
  await page.getByLabel("ชื่อสินค้า").fill(productName);
  await page.getByLabel("ราคาขาย (บาท)").fill("100");
  await page.getByLabel("ราคาทุน (บาท)").fill("50");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/products$/);
  await page.getByRole("link", { name: productName }).click();
  await page.getByLabel("จำนวน").fill("20");
  await page.getByRole("button", { name: "ปรับสต๊อก" }).click();
  await expect(page.getByText("ปรับสต๊อกแล้ว")).toBeVisible();

  // วงจรขาย 10 ชิ้น → invoice → pay
  await page.goto("/shop/sales/new");
  await page.getByLabel("ลูกค้า").selectOption({ label: customer });
  await page.getByLabel("สินค้า").first().selectOption({ label: productName });
  await page.getByLabel("จำนวน").first().fill("10");
  await page.getByRole("button", { name: "บันทึกใบเสนอราคา" }).click();
  await expect(page).toHaveURL(/\/shop\/sales\/[a-zA-Z0-9_-]+$/);
  await page.getByRole("button", { name: "ยืนยันใบขาย" }).click();
  await expect(page.getByText("ยืนยันแล้ว")).toBeVisible();
  await page.getByRole("button", { name: "บันทึกการส่งของ" }).click();
  await expect(page.getByText("ส่งครบแล้ว")).toBeVisible();
  await page.getByRole("button", { name: "ออกใบแจ้งหนี้" }).click();
  await expect(page.getByText("วางบิลแล้ว")).toBeVisible();
  await page.getByRole("button", { name: "รับชำระ" }).click();
  await expect(page.getByText("เสร็จสิ้น")).toBeVisible();

  // ภาพรวมกิจการ
  await page.goto("/shop/reports");
  await expect(page.getByRole("heading", { name: "ภาพรวมกิจการ" })).toBeVisible();
  await expect(page.getByText("ยอดขาย 6 เดือนล่าสุด")).toBeVisible();

  // รายงานการขาย → มีส่วนสินค้าขายดี (top-5 จำกัด จึงเช็คโครงสร้าง)
  await page.goto("/shop/reports/sales");
  await expect(page.getByRole("heading", { name: "รายงานการขาย" })).toBeVisible();
  await expect(page.getByText("สินค้าขายดี 5 อันดับ")).toBeVisible();

  // มูลค่าสินค้าคงคลัง → ลิสต์ทุกสินค้า จึงเห็นสินค้านี้ (on-hand 10)
  await page.goto("/shop/reports/inventory");
  await expect(page.getByText(productName)).toBeVisible();
});
