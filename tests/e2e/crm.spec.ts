import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("CRM: สร้างโอกาส → ย้ายสเตจ → แปลงเป็นใบเสนอราคา", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const customer = `ลูกค้า CRM ${s}`;
  const oppName = `ดีล ${s}`;

  await loginAsOwner(page);

  // ลูกค้า
  await page.goto("/shop/contacts/new");
  await page.getByLabel("ชื่อ").fill(customer);
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/shop\/contacts$/);

  // สร้างโอกาสการขาย ผูกลูกค้า
  await page.goto("/shop/crm/new");
  await page.getByLabel("ชื่อโอกาสการขาย").fill(oppName);
  await page.getByLabel("ลูกค้า").selectOption({ label: customer });
  await page.getByLabel("รายได้คาดหวัง (บาท)").fill("5000");
  await page.getByLabel("ความน่าจะเป็น (%)").fill("40");
  await page.getByRole("button", { name: "สร้างโอกาสการขาย" }).click();
  await expect(page).toHaveURL(/\/shop\/crm\/[a-zA-Z0-9_-]+$/);
  await expect(page.getByText("เปิดอยู่", { exact: true })).toBeVisible();

  // ย้ายสเตจ → ผ่านการคัดกรอง
  await page.getByLabel("สเตจ").selectOption({ label: "ผ่านการคัดกรอง" });
  await page.getByRole("button", { name: "ย้ายสเตจ" }).click();
  await expect(page).toHaveURL(/\/shop\/crm\/[a-zA-Z0-9_-]+$/);

  // แปลงเป็นใบเสนอราคา → เด้งไปหน้า sales (draft)
  await page.getByRole("button", { name: "แปลงเป็นใบเสนอราคา" }).click();
  await expect(page).toHaveURL(/\/shop\/sales\/[a-zA-Z0-9_-]+$/);
  await expect(page.getByText("ร่าง", { exact: true })).toBeVisible();
});

test("CRM: สร้างโอกาส → ทำเครื่องหมายแพ้ → โผล่ในส่วนแพ้บนบอร์ด", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const oppName = `ดีลแพ้ ${s}`;

  await loginAsOwner(page);

  await page.goto("/shop/crm/new");
  await page.getByLabel("ชื่อโอกาสการขาย").fill(oppName);
  await page.getByLabel("รายได้คาดหวัง (บาท)").fill("3000");
  await page.getByRole("button", { name: "สร้างโอกาสการขาย" }).click();
  await expect(page).toHaveURL(/\/shop\/crm\/[a-zA-Z0-9_-]+$/);

  await page.getByPlaceholder("เหตุผลที่แพ้").fill("งบไม่ผ่าน");
  await page.getByRole("button", { name: "ทำเครื่องหมายแพ้" }).click();
  await expect(page.getByText("แพ้", { exact: true })).toBeVisible();

  // กลับไปบอร์ด → เห็นในส่วน "แพ้"
  await page.goto("/shop/crm");
  await expect(page.getByText(oppName)).toBeVisible();
});
