// pure — ไม่มี I/O; ทำให้ email เทียบ/เก็บแบบ canonical (กัน duplicate ต่างตัวพิมพ์)
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
