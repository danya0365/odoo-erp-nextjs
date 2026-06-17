import { test, expect } from "@playwright/test";

// บัญชีจาก scripts/seed.ts
const OWNER = { email: "owner@demo.local", password: "owner1234" };

test("เข้าตรง /shop โดยไม่มี session → เด้งไป /login (proxy)", async ({ page }) => {
  await page.goto("/shop");
  await expect(page).toHaveURL(/\/login$/);
});

test("ล็อกอิน shop_owner → เด้งไป /shop เห็นแดชบอร์ด", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByRole("heading", { name: "แดชบอร์ดร้านค้า" })).toBeVisible();
});
