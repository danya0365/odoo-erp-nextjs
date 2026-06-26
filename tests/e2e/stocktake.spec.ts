import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("ตรวจนับสต๊อก: เปิดรอบ → นับ → ปรับยอดตามส่วนต่าง", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const sku = `ST-${s}`;
  const productName = `สินค้านับ ${s}`;

  await loginAsOwner(page);

  // สินค้า + สต๊อก 20
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

  // เปิดรอบนับ
  await page.goto("/shop/inventory/stocktake");
  await page.getByRole("button", { name: "เปิดรอบนับใหม่" }).click();
  await expect(page).toHaveURL(/\/shop\/inventory\/stocktake\/[a-zA-Z0-9_-]+$/);

  // นับได้จริง 18 (ขาด 2) แล้วยืนยัน
  await page.getByLabel(`นับได้จริง ${productName}`).fill("18");
  await page.getByRole("button", { name: "ยืนยันปรับสต๊อกตามผลนับ" }).click();
  await expect(page.getByText("ปรับสต๊อกแล้ว")).toBeVisible();

  // on-hand เหลือ 18
  await page.goto("/shop/products");
  await expect(page.getByText("18.000", { exact: false }).first()).toBeVisible();
});
