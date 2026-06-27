import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("เบิกค่าใช้จ่าย: ยื่น → อนุมัติ → จ่ายคืน", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const emp = `พนักงาน ${s}`;

  await loginAsOwner(page);

  // เพิ่มพนักงาน
  await page.goto("/shop/hr/employees");
  await page.getByLabel("ชื่อพนักงาน").fill(emp);
  await page.getByLabel("เงินเดือน (บาท)").fill("30000");
  await page.getByRole("button", { name: "เพิ่มพนักงาน" }).click();
  await expect(page.getByText(emp)).toBeVisible();

  // ยื่นเบิก
  await page.goto("/shop/hr/expenses/new");
  await page.getByLabel("พนักงาน").selectOption({ label: emp });
  await page.getByLabel("จำนวนเงิน (บาท)").fill("500");
  await page.getByRole("button", { name: "ยื่นเบิกค่าใช้จ่าย" }).click();
  await expect(page).toHaveURL(/\/shop\/hr\/expenses\/[a-zA-Z0-9_-]+$/);
  await expect(page.getByText("รออนุมัติ")).toBeVisible();

  // อนุมัติ
  await page.getByRole("button", { name: "อนุมัติ" }).click();
  await expect(page.getByText("อนุมัติแล้ว")).toBeVisible();

  // จ่ายคืน
  await page.getByRole("button", { name: /จ่ายคืน/ }).click();
  await expect(page.getByText(/จ่ายคืนแล้ว/)).toBeVisible();
});
