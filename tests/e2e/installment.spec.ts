import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("ผ่อนชำระ: ออกใบแจ้งหนี้ → ตั้งแผน 2 งวด → เก็บครบ → ผ่อนครบแล้ว", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const customer = `ลูกค้าผ่อน ${s}`;
  const sku = `IN-${s}`;
  const productName = `สินค้าผ่อน ${s}`;

  await loginAsOwner(page);

  await page.goto("/shop/contacts/new");
  await page.getByLabel("ชื่อ").fill(customer);
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/contacts$/);

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

  // ขาย → ออกใบแจ้งหนี้ (ไม่จ่าย)
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

  // ตั้งแผนผ่อน 2 งวด
  await page.goto("/shop/sales/installments/new");
  await page.getByRole("row", { name: new RegExp(customer) }).getByRole("link", { name: "เลือก" }).click();
  await expect(page).toHaveURL(/\/shop\/sales\/installments\/new\?invoice=/);
  await page.getByLabel("จำนวนงวด").fill("2");
  await page.getByRole("button", { name: "ตั้งแผนผ่อนชำระ" }).click();
  await expect(page).toHaveURL(/\/shop\/sales\/installments\/[a-zA-Z0-9_-]+$/);

  // เก็บงวดแรก (มัดจำ) → รอให้ขึ้น "ชำระแล้ว" ก่อน
  await page.getByRole("button", { name: "เก็บเงินงวดนี้" }).first().click();
  await expect(page.getByText("ชำระแล้ว").first()).toBeVisible();
  // เก็บงวดที่เหลือ → ผ่อนครบ
  await page.getByRole("button", { name: "เก็บเงินงวดนี้" }).first().click();
  await expect(page.getByText("ผ่อนครบแล้ว")).toBeVisible();
});
