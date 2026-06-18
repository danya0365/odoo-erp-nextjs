import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("สร้างสินค้า → ปรับสต๊อก → คงเหลืออัปเดต", async ({ page }) => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const sku = `SKU-${suffix}`;
  const name = `สินค้าทดสอบ ${suffix}`;

  await loginAsOwner(page);

  // สร้างสินค้า
  await page.goto("/shop/products/new");
  await page.getByLabel("รหัสสินค้า (SKU)").fill(sku);
  await page.getByLabel("ชื่อสินค้า").fill(name);
  await page.getByLabel("ราคาขาย (บาท)").fill("100");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/products$/);

  // เข้า detail
  await page.getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();

  // ปรับสต๊อก +10
  await page.getByLabel("จำนวน").fill("10");
  await page.getByRole("button", { name: "ปรับสต๊อก" }).click();
  await expect(page.getByText("ปรับสต๊อกแล้ว")).toBeVisible();

  // คงเหลือแสดง 10.000
  await expect(page.getByText(/10\.000/).first()).toBeVisible();
});
