import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("ขายแล้วลงบัญชีอัตโนมัติ: งบทดลองสมดุล + มีรายการในสมุดรายวัน", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const customer = `ลูกค้าบัญชี ${s}`;
  const sku = `ACC-SKU-${s}`;
  const productName = `สินค้าบัญชี ${s}`;

  await loginAsOwner(page);

  // ลูกค้า + สินค้า (ราคา 100) + เติมสต๊อก
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

  // วงจรขาย: quotation → confirm → deliver → invoice → pay
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

  // งบทดลองสมดุล
  await page.goto("/shop/accounting/trial-balance");
  await expect(page.getByText("สมดุล ✓", { exact: true })).toBeVisible();
  await expect(page.getByText("รายได้จากการขาย").first()).toBeVisible();

  // สมุดรายวัน: มีรายการที่มาจากใบแจ้งหนี้ + รับ-จ่ายเงิน
  await page.goto("/shop/accounting/entries");
  await expect(page.getByText("ใบแจ้งหนี้").first()).toBeVisible();
  await expect(page.getByText("รับ-จ่ายเงิน").first()).toBeVisible();
});

test("ลงรายการบัญชีด้วยมือ: เดบิต/เครดิตสมดุลแล้วบันทึกได้", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/shop/accounting/entries/new");

  // เดบิต เงินสด 500 / เครดิต ส่วนของเจ้าของ 500
  await page.getByLabel("บัญชี").nth(0).selectOption({ label: "1000 · เงินสดและเงินฝากธนาคาร" });
  await page.getByLabel("เดบิต").nth(0).fill("500");
  await page.getByLabel("บัญชี").nth(1).selectOption({ label: "3000 · ส่วนของเจ้าของ" });
  await page.getByLabel("เครดิต").nth(1).fill("500");

  await expect(page.getByText("สมดุล ✓", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "บันทึกรายการบัญชี" }).click();

  // ไปหน้ารายละเอียด entry — เดบิตรวม = เครดิตรวม
  await expect(page).toHaveURL(/\/shop\/accounting\/entries\/[a-zA-Z0-9_-]+$/);
  await expect(page.getByText("เดบิตรวม ฿500.00")).toBeVisible();
  await expect(page.getByText("เครดิตรวม ฿500.00")).toBeVisible();
});
