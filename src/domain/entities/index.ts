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

export type ProductType = "stockable" | "service" | "consumable";

export interface Product {
  id: string;
  shopId: string;
  sku: string;
  name: string;
  type: ProductType;
  salePrice: number; // minor units
  costPrice: number; // minor units
  taxRateBp: number; // basis points (700 = 7%)
  uom: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockLocation {
  id: string;
  shopId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockMoveType = "in" | "out" | "adjust";
export type StockSourceType = "adjustment" | "delivery" | "receipt";

export interface StockMove {
  id: string;
  shopId: string;
  productId: string;
  locationId: string;
  qtyDelta: number; // signed, scale QTY_SCALE
  type: StockMoveType;
  sourceType: StockSourceType;
  sourceId: string | null;
  note: string | null;
  createdAt: string;
}

export type PartnerType = "customer" | "vendor" | "both";

export interface Partner {
  id: string;
  shopId: string;
  name: string;
  type: PartnerType;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  street: string | null;
  city: string | null;
  country: string | null;
  isCompany: boolean;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
