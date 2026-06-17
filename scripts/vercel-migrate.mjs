// Deploy gate — รัน db:migrate "ก่อน" เวอร์ชันใหม่ขึ้นเสิร์ฟ เฉพาะตอน production build บน Vercel
import { execSync } from "node:child_process";

if (process.env.VERCEL_ENV === "production") {
  console.log("→ production: running db:migrate");
  execSync("npm run db:migrate", { stdio: "inherit" });
} else {
  console.log(`→ skip db:migrate (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"})`);
}
