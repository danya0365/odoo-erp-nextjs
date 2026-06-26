import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("โรดแมป: เข้าจากแดชบอร์ด → เห็นสถานะ เสร็จแล้ว/ยังไม่ทำ", async ({ page }) => {
  await loginAsOwner(page);

  // เข้าจาก tile บนแดชบอร์ด (ทดสอบ nav wiring)
  await page.getByRole("link", { name: "โรดแมป" }).click();
  await expect(page).toHaveURL(/\/shop\/roadmap$/);

  // หัวข้อหน้า + สรุป
  await expect(page.getByRole("heading", { name: "Roadmap" })).toBeVisible();
  await expect(page.getByText("13 โมดูล")).toBeVisible(); // StatCard "เสร็จแล้ว"

  // โมดูลที่ทำเสร็จแล้ว
  await expect(page.getByRole("heading", { name: "การขาย", exact: true })).toBeVisible();

  // backlog ที่ยังไม่ทำ (Odoo-parity) + tier
  await expect(page.getByRole("heading", { name: "Expenses (ค่าใช้จ่าย)" })).toBeVisible();
  await expect(page.getByText("P1 — ต่อยอดจากของที่มีโดยตรง")).toBeVisible();

  // รายการรอตัดสินใจ (store-reviews)
  await expect(page.getByRole("heading", { name: "รีวิวร้านค้า" })).toBeVisible();
});
