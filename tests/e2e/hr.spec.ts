import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("HR: เพิ่มพนักงาน → ออกงวดเงินเดือน → อนุมัติ (ลงบัญชี) → งบทดลองสมดุล", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const empName = `พนักงาน ${s}`;

  await loginAsOwner(page);

  // เพิ่มพนักงาน เงินเดือน 30,000
  await page.goto("/shop/hr/employees");
  await page.getByLabel("ชื่อพนักงาน").fill(empName);
  await page.getByLabel("ตำแหน่ง").fill("นักพัฒนา");
  await page.getByLabel("เงินเดือน (บาท)").fill("30000");
  await page.getByRole("button", { name: "เพิ่มพนักงาน" }).click();
  await expect(page.getByRole("cell", { name: empName })).toBeVisible();

  // ออกงวดเงินเดือน (หัก ณ ที่จ่าย 3%)
  await page.goto("/shop/hr/payroll/new");
  await page.getByLabel("ภาษีหัก ณ ที่จ่าย (%)").fill("3");
  await page.getByRole("button", { name: "สร้างงวดเงินเดือน" }).click();
  await expect(page).toHaveURL(/\/shop\/hr\/payroll\/[a-zA-Z0-9_-]+$/);
  await expect(page.getByText("จ่ายสุทธิ")).toBeVisible();

  // อนุมัติ → ลงบัญชี
  await page.getByRole("button", { name: /อนุมัติจ่ายเงินเดือน/ }).click();
  await expect(page.getByText("ลงบัญชีแล้ว")).toBeVisible();

  // งบทดลองสมดุล + มีบัญชีเงินเดือน
  await page.goto("/shop/accounting/trial-balance");
  await expect(page.getByText("สมดุล ✓", { exact: true })).toBeVisible();
  await expect(page.getByText("เงินเดือนและค่าแรง").first()).toBeVisible();
});
