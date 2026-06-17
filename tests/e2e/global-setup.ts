// รัน migrate + seed กับ dev DB ก่อนเริ่ม e2e (DB-only — ไม่ต้องรอ server)
import { execSync } from "node:child_process";

export default async function globalSetup() {
  execSync("npm run db:migrate", { stdio: "inherit" });
  execSync("npm run db:seed", { stdio: "inherit" });
}
