import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("กระทบยอดธนาคาร: นำเข้า → กระทบยอด + งบการเงิน", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const desc = `โอนรับ ${s}`;

  await loginAsOwner(page);

  // นำเข้ารายการเดินบัญชี
  await page.goto("/shop/accounting/bank-reconciliation");
  await expect(page.getByRole("heading", { name: "กระทบยอดธนาคาร" })).toBeVisible();
  await page.getByLabel("วันที่").fill("2026-03-15");
  await page.getByLabel("รายละเอียด").fill(desc);
  await page.getByLabel("จำนวน").fill("1500");
  await page.getByRole("button", { name: "นำเข้ารายการ" }).click();
  await expect(page.getByRole("row", { name: new RegExp(desc) })).toBeVisible();

  // กระทบยอดรายการนี้
  await page.getByRole("row", { name: new RegExp(desc) }).getByRole("button", { name: "กระทบยอด" }).click();
  await expect(page.getByRole("row", { name: new RegExp(desc) }).getByText("กระทบแล้ว")).toBeVisible();

  // งบการเงิน
  await page.goto("/shop/accounting/financials");
  await expect(page.getByRole("heading", { name: "งบการเงิน" })).toBeVisible();
  await expect(page.getByText("งบกำไรขาดทุน (P&L)")).toBeVisible();
  await expect(page.getByText("งบดุล (Balance Sheet)")).toBeVisible();
});
