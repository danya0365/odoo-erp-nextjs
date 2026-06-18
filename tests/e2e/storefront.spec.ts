import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("Storefront: ลูกค้าสั่งซื้อจากหน้าร้าน → ออร์เดอร์เข้าระบบขาย", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const productName = `สินค้าออนไลน์ ${s}`;
  const custEmail = `web-${s}@x.com`;

  await loginAsOwner(page);

  // เตรียมสินค้าวางขาย (ราคา 100)
  await page.goto("/shop/products/new");
  await page.getByLabel("รหัสสินค้า (SKU)").fill(`WEB-${s}`);
  await page.getByLabel("ชื่อสินค้า").fill(productName);
  await page.getByLabel("ราคาขาย (บาท)").fill("100");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/products$/);

  // หน้าร้านสาธารณะของร้าน demo
  await page.goto("/store/demo");
  await expect(page.getByRole("heading", { name: "ร้านสาธิต" })).toBeVisible();

  // เพิ่มสินค้าลงตะกร้า 1 ชิ้น
  await page.getByRole("button", { name: `เพิ่ม ${productName}` }).click();

  // กรอกข้อมูลแล้วสั่งซื้อ
  await page.getByLabel("ชื่อ").fill("ลูกค้าเว็บ");
  await page.getByLabel("อีเมล").fill(custEmail);
  await page.getByRole("button", { name: "ยืนยันสั่งซื้อ" }).click();

  // หน้ายืนยัน
  await expect(page).toHaveURL(/\/store\/demo\/order\/[a-zA-Z0-9_-]+$/);
  await expect(page.getByText("ขอบคุณสำหรับการสั่งซื้อ")).toBeVisible();
  await expect(page.getByText(productName)).toBeVisible();

  // back-office เห็นออร์เดอร์ออนไลน์
  await page.goto("/shop/storefront");
  await expect(page.getByText(custEmail)).toBeVisible();
});
