import { test, expect, type Page } from "@playwright/test";

const OWNER = { email: "owner@demo.local", password: "owner1234" };

async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(OWNER.email);
  await page.getByLabel("รหัสผ่าน").fill(OWNER.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/shop$/);
}

test("User Journey: เข้าจากแดชบอร์ด → กาง step → ไปหน้า Coverage เห็น URL จริง", async ({ page }) => {
  await loginAsOwner(page);

  // เข้าจาก tile บนแดชบอร์ด
  await page.getByRole("link", { name: "เส้นทางการใช้งาน" }).click();
  await expect(page).toHaveURL(/\/shop\/journey$/);
  await expect(page.getByRole("heading", { name: "User Journey" })).toBeVisible();

  // กาง journey แรก (ขายครบวงจร) → เห็น step link ไปหน้าจริง
  await page.getByText("ขายครบวงจร (ใบเสนอราคา → รับเงิน)").click();
  await expect(page.getByRole("link", { name: "เพิ่มลูกค้า" })).toBeVisible();

  // มี section "สถานการณ์จริง" (real-world gap journeys)
  await expect(page.getByRole("heading", { name: /สถานการณ์จริง/ })).toBeVisible();

  // ไปหน้า Coverage
  await page.getByRole("link", { name: "ดู Coverage" }).click();
  await expect(page).toHaveURL(/\/shop\/journey\/coverage$/);
  await expect(page.getByRole("heading", { name: "Journey Coverage" })).toBeVisible();

  // Gap backlog — ฟีเจอร์ที่ขาดจากสถานการณ์จริง
  await expect(page.getByRole("heading", { name: /Gap backlog — ฟีเจอร์/ })).toBeVisible();
  await expect(page.getByText("ออกใบลดหนี้ (credit note)").first()).toBeVisible();
  await expect(page.getByText("ยังไม่มี").first()).toBeVisible();

  // เห็น URL จริง (ลิงก์เปิดหน้าจริง) + สถานะ
  await expect(page.getByRole("link", { name: "/shop/sales", exact: true }).first()).toBeVisible();
  await expect(page.getByText("URL จริง").first()).toBeVisible();
  await expect(page.getByText("มีแล้ว").first()).toBeVisible();
});
