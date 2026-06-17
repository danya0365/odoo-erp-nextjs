import type { Role } from "@/src/domain/types/roles";

export interface Shop {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string; // ISO-8601
  updatedAt: string;
}

export interface User {
  id: string;
  shopId: string | null; // null = platform_admin
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** variant ที่พ่วง field ลับ — ใช้เฉพาะตอน verify, ห้ามหลุดออกนอก infra/use-case */
export interface UserWithSecret extends User {
  passwordHash: string;
}

export interface Session {
  id: string; // = token ใน cookie
  userId: string;
  expiresAt: string; // ISO-8601
  createdAt: string;
}
