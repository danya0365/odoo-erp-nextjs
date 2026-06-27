import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("งานบริการ: แจ้งซ่อม → มอบหมายช่าง → ปิดงาน", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const customer = `ลูกค้าซ่อม ${s}`;
  const tech = `ช่าง ${s}`;

  await loginAsOwner(page);

  // ลูกค้า + ช่าง
  await page.goto("/shop/contacts/new");
  await page.getByLabel("ชื่อ").fill(customer);
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/contacts$/);

  await page.goto("/shop/hr/employees");
  await page.getByLabel("ชื่อพนักงาน").fill(tech);
  await page.getByLabel("เงินเดือน (บาท)").fill("20000");
  await page.getByRole("button", { name: "เพิ่มพนักงาน" }).click();
  await expect(page.getByText(tech)).toBeVisible();

  // เปิดใบงาน
  await page.goto("/shop/service/new");
  await page.getByLabel("ลูกค้า").selectOption({ label: customer });
  await page.getByLabel("เรื่อง").fill("แอร์ไม่เย็น");
  await page.getByRole("button", { name: "เปิดใบงาน" }).click();
  await expect(page).toHaveURL(/\/shop\/service\/[a-zA-Z0-9_-]+$/);
  await expect(page.getByText("เปิดงาน")).toBeVisible();

  // มอบหมายช่าง
  await page.getByLabel("ช่าง").selectOption({ label: tech });
  await page.getByRole("button", { name: "มอบหมาย + นัดหมาย" }).click();
  await expect(page.getByText("มอบหมายแล้ว").first()).toBeVisible();

  // ปิดงาน
  await page.getByRole("button", { name: /ปิดงาน/ }).click();
  await expect(page.getByText(/งานเสร็จสิ้นแล้ว/)).toBeVisible();
});
