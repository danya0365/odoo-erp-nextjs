export type Role = "platform_admin" | "shop_owner" | "staff";

/** หน้าแรกของแต่ละ role — ใช้ตอน redirect หลัง login */
export const ROLE_HOME: Record<Role, string> = {
  platform_admin: "/admin",
  shop_owner: "/shop",
  staff: "/staff",
};
