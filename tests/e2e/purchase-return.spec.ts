import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("คืนของผู้ขาย: จัดซื้อจน bill → คืนของ → ใบลดหนี้ผู้ขาย (on-hand ลด)", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const vendor = `ผู้ขาย ${s}`;
  const sku = `PR-${s}`;
  const productName = `วัตถุดิบคืน ${s}`;

  await loginAsOwner(page);

  // ผู้ขาย + สินค้า
  await page.goto("/shop/contacts/new");
  await page.getByLabel("ชื่อ").fill(vendor);
  await page.getByLabel("ประเภท").selectOption("vendor");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/contacts$/);

  await page.goto("/shop/products/new");
  await page.getByLabel("รหัสสินค้า (SKU)").fill(sku);
  await page.getByLabel("ชื่อสินค้า").fill(productName);
  await page.getByLabel("ราคาขาย (บาท)").fill("100");
  await page.getByLabel("ราคาทุน (บาท)").fill("80");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/products$/);

  // จัดซื้อ 10 → ยืนยัน → รับของ → ตั้งหนี้
  await page.goto("/shop/purchase/new");
  await page.getByLabel("ผู้ขาย").selectOption({ label: vendor });
  await page.getByLabel("สินค้า").first().selectOption({ label: productName });
  await page.getByLabel("จำนวน").first().fill("10");
  await page.getByRole("button", { name: "บันทึกใบขอราคา" }).click();
  await expect(page).toHaveURL(/\/shop\/purchase\/[a-zA-Z0-9_-]+$/);
  await page.getByRole("button", { name: "ยืนยันใบสั่งซื้อ" }).click();
  await expect(page.getByText("ยืนยันแล้ว")).toBeVisible();
  await page.getByRole("button", { name: "บันทึกการรับของ" }).click();
  await expect(page.getByText("รับครบแล้ว")).toBeVisible();
  await page.getByRole("button", { name: "ตั้งหนี้ผู้ขาย" }).click();
  await expect(page.getByText("ตั้งหนี้แล้ว")).toBeVisible();

  // คืนของผู้ขาย
  await page.goto("/shop/purchase/returns/new");
  await page.getByRole("row", { name: vendor }).getByRole("link", { name: "เลือก" }).click();
  await expect(page).toHaveURL(/\/shop\/purchase\/returns\/new\?bill=/);
  await page.getByLabel(`จำนวนที่คืน ${productName}`).fill("10");
  await page.getByRole("button", { name: "สร้างใบคืนของผู้ขาย" }).click();
  await expect(page).toHaveURL(/\/shop\/purchase\/returns\/[a-zA-Z0-9_-]+$/);

  // ยืนยันคืน → ออกใบลดหนี้ผู้ขาย
  await page.getByRole("button", { name: /ยืนยันคืนของ/ }).click();
  await expect(page.getByText(/ออกใบลดหนี้ผู้ขายแล้ว/)).toBeVisible();
});
