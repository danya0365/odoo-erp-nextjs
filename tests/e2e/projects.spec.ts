import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("Project: สร้างโครงการ → เพิ่มงาน → ลงเวลา → สรุปชั่วโมง", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const empName = `ทีมงาน ${s}`;
  const projectName = `โครงการ ${s}`;
  const taskName = `งาน ${s}`;

  await loginAsOwner(page);

  // เตรียมพนักงาน
  await page.goto("/shop/hr/employees");
  await page.getByLabel("ชื่อพนักงาน").fill(empName);
  await page.getByLabel("เงินเดือน (บาท)").fill("20000");
  await page.getByRole("button", { name: "เพิ่มพนักงาน" }).click();
  await expect(page.getByRole("cell", { name: empName })).toBeVisible();

  // สร้างโครงการ
  await page.goto("/shop/projects/new");
  await page.getByLabel("ชื่อโครงการ").fill(projectName);
  await page.getByRole("button", { name: "สร้างโครงการ" }).click();
  await expect(page).toHaveURL(/\/shop\/projects\/[a-zA-Z0-9_-]+$/);

  // เพิ่มงาน
  await page.getByLabel("ชื่องาน").fill(taskName);
  await page.getByRole("button", { name: "เพิ่มงาน" }).click();
  await expect(page.getByRole("cell", { name: taskName })).toBeVisible();

  // ลงเวลา 1.5 ชม. ที่งานนี้
  await page.getByLabel("พนักงาน", { exact: true }).selectOption({ label: empName });
  await page.getByLabel("งาน", { exact: true }).selectOption({ label: taskName });
  await page.getByLabel("ชั่วโมง").fill("1.5");
  await page.getByRole("button", { name: "ลงเวลา" }).click();
  await expect(page.getByText("ลงเวลาแล้ว")).toBeVisible();

  // ชั่วโมงรวม 1.50 ปรากฏ
  await expect(page.getByText("1.50").first()).toBeVisible();
});
