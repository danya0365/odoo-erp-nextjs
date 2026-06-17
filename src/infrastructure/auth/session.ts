import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { container } from "@/src/infrastructure/di/container";
import type { User } from "@/src/domain/entities";
import type { Role } from "@/src/domain/types/roles";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "es_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** อ่าน+ตรวจ session จาก cookie → DB. authz "จริง" (proxy เป็นแค่ optimistic). */
export async function getSession(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const result = await container.sessionRepository.findValid(token, new Date());
  return result?.user ?? null;
}

/** บังคับ login + role. เรียกบนสุดของทุก protected layout/page และในทุก action. */
export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await getSession();
  if (!user) redirect("/login");
  if (roles.length > 0 && !roles.includes(user.role)) redirect("/login");
  return user;
}

/** ตรวจว่า user เป็นเจ้าของ tenant นี้ (platform_admin bypass). */
export function requireShopScope(user: User, shopId: string): void {
  if (user.role === "platform_admin") return;
  if (user.shopId !== shopId) throw new Error("Forbidden: scope mismatch");
}

/** สร้าง session row + เซ็ต httpOnly cookie. ใช้ใน Server Action เท่านั้น. */
export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await container.sessionRepository.create({
    userId,
    expiresAt: expiresAt.toISOString(),
  });
  (await cookies()).set(COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** ลบ session row + clear cookie (logout). */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await container.sessionRepository.delete(token);
  store.delete(COOKIE_NAME);
}
