import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

async function createProduct(page: Page, sku: string, name: string, stock?: string) {
  await page.goto("/shop/products/new");
  await page.getByLabel("รหัสสินค้า (SKU)").fill(sku);
  await page.getByLabel("ชื่อสินค้า").fill(name);
  await page.getByLabel("ราคาขาย (บาท)").fill("100");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/products$/);
  if (stock) {
    await page.getByRole("link", { name }).click();
    await page.getByLabel("จำนวน").fill(stock);
    await page.getByRole("button", { name: "ปรับสต๊อก" }).click();
    await expect(page.getByText("ปรับสต๊อกแล้ว")).toBeVisible();
  }
}

test("การผลิต: สร้างสูตร → ใบสั่งผลิต → ยืนยัน → ผลิต (ตัดวัตถุดิบ + รับสินค้า)", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const fg = `สำเร็จรูป ${s}`;
  const c1 = `วัตถุดิบA ${s}`;
  const c2 = `วัตถุดิบB ${s}`;
  const bomName = `สูตร ${s}`;

  await loginAsOwner(page);

  await createProduct(page, `FG-${s}`, fg);
  await createProduct(page, `C1-${s}`, c1, "100");
  await createProduct(page, `C2-${s}`, c2, "100");

  // สร้างสูตร: สำเร็จรูป fg, ใช้ c1 ×2, c2 ×1
  await page.goto("/shop/manufacturing/boms/new");
  await page.getByLabel("ชื่อสูตร").fill(bomName);
  await page.getByLabel("สินค้าสำเร็จรูป").selectOption({ label: fg });
  await page.getByLabel("วัตถุดิบ").first().selectOption({ label: c1 });
  await page.getByLabel("ใช้ต่อหน่วย").first().fill("2");
  await page.getByRole("button", { name: "เพิ่มวัตถุดิบ" }).click();
  await page.getByLabel("วัตถุดิบ").nth(1).selectOption({ label: c2 });
  await page.getByLabel("ใช้ต่อหน่วย").nth(1).fill("1");
  await page.getByRole("button", { name: "บันทึกสูตร" }).click();
  await expect(page).toHaveURL(/\/shop\/manufacturing\/boms$/);

  // สร้างใบสั่งผลิต 5 ชิ้น
  await page.goto("/shop/manufacturing/new");
  await page.getByLabel("สูตรการผลิต").selectOption({ label: bomName });
  await page.getByLabel("จำนวนที่จะผลิต").fill("5");
  await page.getByRole("button", { name: "สร้างใบสั่งผลิต" }).click();
  await expect(page).toHaveURL(/\/shop\/manufacturing\/[a-zA-Z0-9_-]+$/);

  // ยืนยัน
  await page.getByRole("button", { name: "ยืนยันใบสั่งผลิต" }).click();
  await expect(page.getByText("ยืนยันแล้ว")).toBeVisible();

  // ผลิต
  await page.getByRole("button", { name: /ผลิต \(ตัดวัตถุดิบ/ }).click();
  await expect(page.getByText("เสร็จสิ้น")).toBeVisible();

  // ตรวจสต๊อก: สำเร็จรูป +5, วัตถุดิบA 100-10=90
  await page.goto("/shop/products");
  await expect(page.getByRole("row", { name: new RegExp(fg) }).getByText("5.000")).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(c1) }).getByText("90.000")).toBeVisible();
});
