import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("อายุลูกหนี้: ขายเชื่อ (ไม่จ่าย) → เห็นในอายุหนี้ → ส่งใบทวง", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const customer = `ลูกหนี้ ${s}`;
  const sku = `AR-${s}`;
  const productName = `สินค้าเชื่อ ${s}`;

  await loginAsOwner(page);

  // ลูกค้า + เครดิตเทอม 30 วัน
  await page.goto("/shop/contacts/new");
  await page.getByLabel("ชื่อ").fill(customer);
  await page.getByLabel("เครดิตเทอม (วัน)").fill("30");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/contacts$/);

  // สินค้า + สต๊อก
  await page.goto("/shop/products/new");
  await page.getByLabel("รหัสสินค้า (SKU)").fill(sku);
  await page.getByLabel("ชื่อสินค้า").fill(productName);
  await page.getByLabel("ราคาขาย (บาท)").fill("100");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/products$/);
  await page.getByRole("link", { name: productName }).click();
  await page.getByLabel("จำนวน").fill("20");
  await page.getByRole("button", { name: "ปรับสต๊อก" }).click();
  await expect(page.getByText("ปรับสต๊อกแล้ว")).toBeVisible();

  // ขาย → ออกใบแจ้งหนี้ (ไม่จ่าย → ค้างชำระ)
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

  // อายุลูกหนี้
  await page.goto("/shop/accounting/receivables");
  await expect(page.getByRole("heading", { name: "อายุลูกหนี้ + ทวงหนี้" })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(customer) })).toBeVisible();

  // ส่งใบทวงในแถวลูกค้านี้
  await page.getByRole("row", { name: new RegExp(customer) }).getByRole("button", { name: "ส่งใบทวง" }).click();
  // ยังเห็นลูกค้าอยู่ (action สำเร็จ ไม่ error)
  await expect(page.getByRole("row", { name: new RegExp(customer) })).toBeVisible();
});
