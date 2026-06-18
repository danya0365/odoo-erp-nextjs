import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("คลังขั้นสูง: สร้างคลัง → โอนย้าย → ตั้งจุดสั่งซื้อซ้ำ", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const sku = `INV-${s}`;
  const productName = `สินค้าโอน ${s}`;
  const locName = `คลัง ${s}`;

  await loginAsOwner(page);

  // สร้างคลังใหม่
  await page.goto("/shop/inventory/locations");
  await page.getByLabel("ชื่อคลังใหม่").fill(locName);
  await page.getByRole("button", { name: "เพิ่มคลัง" }).click();
  await expect(page.getByRole("cell", { name: locName })).toBeVisible();

  // สินค้า + เติมสต๊อก 20 (เข้าคลังหลัก)
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

  // โอน 5 จากคลังหลัก → คลังใหม่
  await page.goto("/shop/inventory/transfer");
  await page.getByLabel("สินค้า").selectOption({ label: productName });
  await page.getByLabel("จากคลัง").selectOption({ label: "คลังหลัก" });
  await page.getByLabel("ไปคลัง").selectOption({ label: locName });
  await page.getByLabel("จำนวน").fill("5");
  await page.getByRole("button", { name: "โอนสต๊อก" }).click();
  await expect(page.getByText("โอนสต๊อกแล้ว")).toBeVisible();
  // การโอนล่าสุดแสดงสินค้านี้
  await expect(page.getByRole("cell", { name: productName })).toBeVisible();

  // ตั้งจุดสั่งซื้อซ้ำ: min 30 / max 50 (on-hand รวม 20 ≤ 30 → ควรเติม 30)
  await page.goto("/shop/inventory/reorder");
  await page.getByLabel(`ขั้นต่ำ ${sku}`).fill("30");
  await page.getByLabel(`สูงสุด ${sku}`).fill("50");
  const row = page.getByRole("row", { name: new RegExp(productName) });
  await row.getByRole("button", { name: "บันทึก" }).click();

  // หลังบันทึก แถวนี้แสดงควรเติม 30.000
  const updatedRow = page.getByRole("row", { name: new RegExp(productName) });
  await expect(updatedRow.getByText("30.000")).toBeVisible();
});
