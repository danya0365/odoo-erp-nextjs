import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("shop_owner สร้างผู้ติดต่อใหม่ แล้วเห็นในรายการ", async ({ page }) => {
  const name = `ลูกค้าทดสอบ ${crypto.randomUUID().slice(0, 8)}`;
  await loginAsOwner(page);

  await page.goto("/shop/contacts/new");
  await page.getByLabel("ชื่อ").fill(name);
  await page.getByLabel("อีเมล").fill("e2e@test.local");
  await page.getByRole("button", { name: "บันทึก" }).click();

  // redirect กลับ list + เห็นชื่อที่เพิ่ง สร้าง
  await expect(page).toHaveURL(/\/shop\/contacts$/);
  await expect(page.getByText(name).first()).toBeVisible();
});
