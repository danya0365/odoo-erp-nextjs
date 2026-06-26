import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("ภพ.30: เปิดรายงาน → บันทึกการยื่น → ขึ้นประวัติ", async ({ page }) => {
  // งวดสุ่มในอนาคต กันชนกับการยื่นเดิมใน local.db (unique ต่อ shop+period)
  const yy = 2090 + Math.floor(Math.random() * 9);
  const mm = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
  const month = `${yy}-${mm}`;

  await loginAsOwner(page);
  await page.goto(`/shop/accounting/vat?month=${month}`);

  await expect(page.getByRole("heading", { name: "ภาษีมูลค่าเพิ่ม (ภพ.30)" })).toBeVisible();
  await expect(page.getByText("ภาษีขาย (output VAT)")).toBeVisible();
  await expect(page.getByText("ภาษีซื้อ (input VAT)")).toBeVisible();

  // บันทึกการยื่นงวดนี้
  await page.getByRole("button", { name: new RegExp(`บันทึกการยื่น ภพ.30 งวด ${month}`) }).click();

  // ยื่นแล้ว → เห็น alert + ขึ้นในประวัติ
  await expect(page.getByText(new RegExp(`ยื่น ภพ.30 งวด ${month} แล้ว`))).toBeVisible();
  await expect(page.getByRole("cell", { name: month, exact: true })).toBeVisible();
});
