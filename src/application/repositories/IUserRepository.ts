import type { User, UserWithSecret } from "@/src/domain/entities";
import type { Role } from "@/src/domain/types/roles";

export interface CreateUserInput {
  shopId: string | null;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
}

export interface IUserRepository {
  create(input: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  /** คืน field ลับ (passwordHash) — สำหรับ verify ตอน login เท่านั้น */
  findByEmailWithSecret(email: string): Promise<UserWithSecret | null>;
  /** scope ด้วย tenant id เสมอ */
  listByShop(shopId: string): Promise<User[]>;
  setActive(id: string, isActive: boolean): Promise<User>;
}
