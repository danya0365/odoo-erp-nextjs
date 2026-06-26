import { test, expect } from "@playwright/test";

// ลูกค้าไม่ต้องล็อกอิน (หน้า public) — กดส่งรีวิวต้อง redirect กลับ ไม่ค้าง
test("รีวิวร้าน: ลูกค้ากดส่งรีวิว → กลับหน้าร้าน + เห็นรีวิว (ไม่ค้าง)", async ({ page }) => {
  const s = crypto.randomUUID().slice(0, 6);
  const reviewer = `นักรีวิว ${s}`;
  const comment = `ประทับใจมาก ${s}`;

  await page.goto("/store/demo");
  await expect(page.getByRole("heading", { name: "รีวิวร้าน" })).toBeVisible();

  await page.getByLabel("ชื่อของคุณ").fill(reviewer);
  await page.getByLabel("ให้คะแนน").selectOption("4");
  await page.getByLabel("ความคิดเห็น").fill(comment);

  await page.getByRole("button", { name: "ส่งรีวิว" }).click();

  // PRG: redirect กลับหน้าร้านพร้อม ?reviewed=1 (ต้องไม่ค้าง)
  await expect(page).toHaveURL(/\/store\/demo\?reviewed=1/, { timeout: 15000 });
  await expect(page.getByText("ขอบคุณสำหรับรีวิว!")).toBeVisible();
  // รีวิวที่เพิ่งส่งปรากฏในรายการ
  await expect(page.getByText(reviewer)).toBeVisible();
  await expect(page.getByText(comment)).toBeVisible();
});
