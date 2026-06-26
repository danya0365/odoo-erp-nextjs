import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("RMA: ขายจน invoice+จ่าย → คืนสินค้า → ใบลดหนี้ → คืนเงิน (on-hand กลับเพิ่ม)", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const customer = `ลูกค้าคืน ${s}`;
  const sku = `RET-${s}`;
  const productName = `สินค้าคืน ${s}`;

  await loginAsOwner(page);

  // ลูกค้า + สินค้า (100) + สต๊อก 50
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
  await page.getByLabel("จำนวน").fill("50");
  await page.getByRole("button", { name: "ปรับสต๊อก" }).click();
  await expect(page.getByText("ปรับสต๊อกแล้ว")).toBeVisible();

  // ขาย 10 → ยืนยัน → ส่ง → วางบิล → จ่าย
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

  // คืนสินค้า → เลือกใบแจ้งหนี้ของลูกค้ารายนี้
  await page.goto("/shop/sales/returns/new");
  await page.getByRole("row", { name: customer }).getByRole("link", { name: "เลือก" }).click();
  await expect(page).toHaveURL(/\/shop\/sales\/returns\/new\?invoice=/);

  // คืน 10 ชิ้น
  await page.getByLabel(`จำนวนที่คืน ${productName}`).fill("10");
  await page.getByRole("button", { name: "สร้างใบคืนสินค้า" }).click();
  await expect(page).toHaveURL(/\/shop\/sales\/returns\/[a-zA-Z0-9_-]+$/);

  // ยืนยันคืน → ออกใบลดหนี้แล้ว
  await page.getByRole("button", { name: /ยืนยันคืน/ }).click();
  await expect(page.getByText("ออกใบลดหนี้แล้ว")).toBeVisible();

  // คืนเงิน → คืนเงินแล้ว
  await page.getByRole("button", { name: /คืนเงินลูกค้า/ }).click();
  await expect(page.getByText(/คืนเงินลูกค้าแล้ว/)).toBeVisible();

  // on-hand กลับเป็น 50
  await page.goto("/shop/products");
  await expect(page.getByText("50.000", { exact: false }).first()).toBeVisible();
});
