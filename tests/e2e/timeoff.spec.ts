import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("ลงเวลา/การลา: ลงเวลา OT → ยื่นลา → อนุมัติ", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const emp = `พนง ${s}`;

  await loginAsOwner(page);

  await page.goto("/shop/hr/employees");
  await page.getByLabel("ชื่อพนักงาน").fill(emp);
  await page.getByLabel("เงินเดือน (บาท)").fill("30000");
  await page.getByRole("button", { name: "เพิ่มพนักงาน" }).click();
  await expect(page.getByText(emp)).toBeVisible();

  await page.goto("/shop/hr/timeoff");
  await expect(page.getByRole("heading", { name: "ลงเวลา / การลา / OT" })).toBeVisible();

  // ลงเวลา
  await page.getByLabel("พนักงานลงเวลา").selectOption({ label: emp });
  await page.getByLabel("วันที่ลงเวลา").fill("2026-03-02");
  await page.getByLabel("ชั่วโมงทำงาน").fill("8");
  await page.getByLabel("โอที").fill("2");
  await page.getByRole("button", { name: "ลงเวลา" }).click();
  await expect(page.getByText("สรุปชั่วโมงต่อพนักงาน (ใช้อ้างอิงเข้าเงินเดือน)")).toBeVisible();

  // ยื่นลา
  await page.getByLabel("พนักงานขอลา").selectOption({ label: emp });
  await page.getByLabel("จำนวนวันลา").fill("1");
  await page.getByRole("button", { name: "ยื่นขอลา" }).click();
  await expect(page.getByRole("row", { name: new RegExp(emp) }).first()).toBeVisible();

  // อนุมัติคำขอลา
  await page.getByRole("button", { name: "อนุมัติ" }).first().click();
  await expect(page.getByText("อนุมัติแล้ว")).toBeVisible();
});
