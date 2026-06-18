import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("วงจรซื้อครบ: rfq → confirm → receive → bill → pay (on-hand เพิ่ม)", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const vendor = `ผู้ขาย ${s}`;
  const sku = `PO-SKU-${s}`;
  const productName = `วัตถุดิบ ${s}`;

  await loginAsOwner(page);

  // 1) ผู้ขาย (ประเภท vendor)
  await page.goto("/shop/contacts/new");
  await page.getByLabel("ชื่อ").fill(vendor);
  await page.getByLabel("ประเภท").selectOption("vendor");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/contacts$/);

  // 2) สินค้า (ราคาทุน 50)
  await page.goto("/shop/products/new");
  await page.getByLabel("รหัสสินค้า (SKU)").fill(sku);
  await page.getByLabel("ชื่อสินค้า").fill(productName);
  await page.getByLabel("ราคาทุน (บาท)").fill("50");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/products$/);

  // 3) ใบขอราคา qty 30
  await page.goto("/shop/purchase/new");
  await page.getByLabel("ผู้ขาย").selectOption({ label: vendor });
  await page.getByLabel("สินค้า").first().selectOption({ label: productName });
  await page.getByLabel("จำนวน").first().fill("30");
  await page.getByRole("button", { name: "บันทึกใบขอราคา" }).click();
  await expect(page).toHaveURL(/\/shop\/purchase\/[a-zA-Z0-9_-]+$/);

  // 4) ยืนยัน
  await page.getByRole("button", { name: "ยืนยันใบสั่งซื้อ" }).click();
  await expect(page.getByText("ยืนยันแล้ว")).toBeVisible();

  // 5) รับของ (ค่าเริ่มต้น = คงค้าง)
  await page.getByRole("button", { name: "บันทึกการรับของ" }).click();
  await expect(page.getByText("รับครบแล้ว")).toBeVisible();

  // 6) ตั้งหนี้
  await page.getByRole("button", { name: "ตั้งหนี้ผู้ขาย" }).click();
  await expect(page.getByText("ตั้งหนี้แล้ว")).toBeVisible();

  // 7) จ่ายเงินเต็ม → เสร็จสิ้น
  await page.getByRole("button", { name: "จ่ายเงิน" }).click();
  await expect(page.getByText("เสร็จสิ้น")).toBeVisible();
  await expect(page.getByText("ชำระแล้ว", { exact: true })).toBeVisible();

  // 8) on-hand เพิ่มเป็น 30
  await page.goto("/shop/products");
  await expect(page.getByText("30.000", { exact: false }).first()).toBeVisible();
});
