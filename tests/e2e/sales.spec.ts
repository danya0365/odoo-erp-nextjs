import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("วงจรขายครบ: quotation → confirm → deliver → invoice → pay (on-hand ลด)", async ({
  page,
}) => {
  const s = crypto.randomUUID().slice(0, 6);
  const customer = `ลูกค้า ${s}`;
  const sku = `SO-SKU-${s}`;
  const productName = `สินค้าขาย ${s}`;

  await loginAsOwner(page);

  // 1) ลูกค้า
  await page.goto("/shop/contacts/new");
  await page.getByLabel("ชื่อ").fill(customer);
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/contacts$/);

  // 2) สินค้า + ราคา 100
  await page.goto("/shop/products/new");
  await page.getByLabel("รหัสสินค้า (SKU)").fill(sku);
  await page.getByLabel("ชื่อสินค้า").fill(productName);
  await page.getByLabel("ราคาขาย (บาท)").fill("100");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/products$/);

  // 3) เติมสต๊อก +50
  await page.getByRole("link", { name: productName }).click();
  await page.getByLabel("จำนวน").fill("50");
  await page.getByRole("button", { name: "ปรับสต๊อก" }).click();
  await expect(page.getByText("ปรับสต๊อกแล้ว")).toBeVisible();

  // 4) สร้างใบเสนอราคา (qty 10)
  await page.goto("/shop/sales/new");
  await page.getByLabel("ลูกค้า").selectOption({ label: customer });
  await page.getByLabel("สินค้า").first().selectOption({ label: productName });
  await page.getByLabel("จำนวน").first().fill("10");
  await page.getByRole("button", { name: "บันทึกใบเสนอราคา" }).click();
  await expect(page).toHaveURL(/\/shop\/sales\/[a-zA-Z0-9_-]+$/);

  // 5) ยืนยัน
  await page.getByRole("button", { name: "ยืนยันใบขาย" }).click();
  await expect(page.getByText("ยืนยันแล้ว")).toBeVisible();

  // 6) ส่งของ (ค่าเริ่มต้น = คงค้างทั้งหมด)
  await page.getByRole("button", { name: "บันทึกการส่งของ" }).click();
  await expect(page.getByText("ส่งครบแล้ว")).toBeVisible();

  // 7) ออกใบแจ้งหนี้
  await page.getByRole("button", { name: "ออกใบแจ้งหนี้" }).click();
  await expect(page.getByText("วางบิลแล้ว")).toBeVisible();

  // 8) รับชำระเต็มจำนวน → เสร็จสิ้น
  await page.getByRole("button", { name: "รับชำระ" }).click();
  await expect(page.getByText("เสร็จสิ้น")).toBeVisible();
  await expect(page.getByText("ชำระแล้ว", { exact: true })).toBeVisible();

  // 9) on-hand ลดเหลือ 40
  await page.goto("/shop/products");
  await expect(page.getByText("40.000", { exact: false }).first()).toBeVisible();
});
