import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("การตลาด: สร้างโปร → คิดส่วนลด → สะสมแต้ม", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6).toUpperCase();
  const code = `SAVE${s}`;
  const customer = `สมาชิก ${s}`;

  await loginAsOwner(page);

  await page.goto("/shop/contacts/new");
  await page.getByLabel("ชื่อ").fill(customer);
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/contacts$/);

  await page.goto("/shop/marketing");
  await expect(page.getByRole("heading", { name: "โปรโมชั่น & แต้มสะสม" })).toBeVisible();

  // สร้างโปร 10% ขั้นต่ำ 500
  await page.getByLabel("โค้ดโปรโมชั่น").fill(code);
  await page.getByLabel("ค่าส่วนลด").fill("10");
  await page.getByLabel("ยอดขั้นต่ำ").fill("500");
  await page.getByRole("button", { name: "สร้างโปรโมชั่น" }).click();
  await expect(page.getByText("สร้างโปรโมชั่นแล้ว")).toBeVisible();
  await expect(page.getByRole("cell", { name: code, exact: true })).toBeVisible();

  // คิดส่วนลด: ยอด 1000 → ลด 100
  await page.getByLabel("โค้ดที่จะใช้").fill(code);
  await page.getByLabel("ยอดซื้อ", { exact: true }).fill("1000");
  await page.getByRole("button", { name: "คำนวณส่วนลด" }).click();
  await expect(page.getByText(/ส่วนลด ฿100\.00/)).toBeVisible();

  // สะสมแต้ม: ยอด 500 → 5 แต้ม
  await page.getByLabel("ลูกค้าสะสมแต้ม").selectOption({ label: customer });
  await page.getByLabel("ยอดซื้อสะสมแต้ม").fill("500");
  await page.getByRole("button", { name: "สะสมแต้ม" }).click();
  await expect(page.getByText(/แต้มคงเหลือ 5/)).toBeVisible();
});
