import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("ล็อต/วันหมดอายุ: รับเข้า 2 ล็อต → ตัด FEFO", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const sku = `LOT-${s}`;
  const productName = `นม ${s}`;

  await loginAsOwner(page);

  // สินค้า
  await page.goto("/shop/products/new");
  await page.getByLabel("รหัสสินค้า (SKU)").fill(sku);
  await page.getByLabel("ชื่อสินค้า").fill(productName);
  await page.getByLabel("ราคาขาย (บาท)").fill("100");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/products$/);

  await page.goto("/shop/inventory/lots");
  await expect(page.getByRole("heading", { name: /ล็อต \/ วันหมดอายุ/ })).toBeVisible();

  // รับเข้าล็อตหมดอายุก่อน (3 ชิ้น)
  await page.getByLabel("สินค้ารับเข้าล็อต").selectOption({ label: productName });
  await page.getByLabel("เลขล็อต").fill("EARLY");
  await page.getByLabel("วันหมดอายุ").fill("2026-03-01");
  await page.getByLabel("จำนวนรับเข้า").fill("3");
  await page.getByRole("button", { name: "รับเข้าล็อต" }).click();
  await expect(page.getByText("รับเข้าล็อตแล้ว")).toBeVisible();

  // รับเข้าล็อตหมดอายุทีหลัง (5 ชิ้น)
  await page.getByLabel("สินค้ารับเข้าล็อต").selectOption({ label: productName });
  await page.getByLabel("เลขล็อต").fill("LATE");
  await page.getByLabel("วันหมดอายุ").fill("2027-01-01");
  await page.getByLabel("จำนวนรับเข้า").fill("5");
  await page.getByRole("button", { name: "รับเข้าล็อต" }).click();
  await expect(page.getByText("รับเข้าล็อตแล้ว")).toBeVisible();

  // ตัด FEFO 4 → ตัด EARLY ก่อน
  await page.getByLabel("สินค้าตัด FEFO").selectOption({ label: productName });
  await page.getByLabel("จำนวนตัด FEFO").fill("4");
  await page.getByRole("button", { name: "ตัดสต๊อก (FEFO)" }).click();
  await expect(page.getByText(/ตัด FEFO: EARLY/)).toBeVisible();
});
