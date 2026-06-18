import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

// ปิดกะค้าง (ถ้ามีจากรอบก่อน) เพื่อให้เริ่มจากกะใหม่เสมอ
async function ensureClosed(page: Page) {
  await page.goto("/shop/pos");
  const closeBtn = page.getByRole("button", { name: "ปิดกะ", exact: true });
  if (await closeBtn.isVisible().catch(() => false)) {
    await page.getByLabel("เงินสดนับได้จริง (บาท)").fill("0");
    await closeBtn.click();
    await expect(page).toHaveURL(/\/shop\/pos\/sessions\/[a-zA-Z0-9_-]+$/);
    await page.goto("/shop/pos");
  }
}

test("POS: เปิดกะ → ขายสด (ตัดสต๊อก) → ปิดกะเงินสดตรง", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const sku = `POS-${s}`;
  const productName = `สินค้า POS ${s}`;

  await loginAsOwner(page);

  // สินค้า (ขาย 100) + สต๊อก 20
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

  // เปิดกะใหม่ (เงินตั้งต้น 500)
  await ensureClosed(page);
  await page.getByLabel("เงินสดตั้งต้น (บาท)").fill("500");
  await page.getByRole("button", { name: "เปิดกะ", exact: true }).click();
  await expect(page.getByText("รายการขาย")).toBeVisible();

  // ขาย 2 ชิ้น เงินสด
  await page.getByLabel("สินค้า").selectOption({ label: productName });
  await page.getByLabel("จำนวน").fill("2");
  await page.getByRole("button", { name: "ชำระเงิน" }).click();
  await expect(page.getByText(/ขายสำเร็จ/)).toBeVisible();

  // สต๊อกลดเหลือ 18
  await page.goto("/shop/products");
  await expect(page.getByText("18.000", { exact: false }).first()).toBeVisible();

  // ปิดกะ: ที่ควรมี = 500 + 200 = 700 → นับ 700 ตรง
  await page.goto("/shop/pos");
  await page.getByLabel("เงินสดนับได้จริง (บาท)").fill("700");
  await page.getByRole("button", { name: "ปิดกะ", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\/pos\/sessions\/[a-zA-Z0-9_-]+$/);
  await expect(page.getByText("ปิดแล้ว", { exact: true })).toBeVisible();
  await expect(page.getByText("฿700.00").first()).toBeVisible(); // เงินที่ควรมี
});
