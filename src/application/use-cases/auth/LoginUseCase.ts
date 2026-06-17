import type { User } from "@/src/domain/entities";
import { normalizeEmail } from "@/src/domain/services/email";
import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { IPasswordHasher } from "@/src/application/services/IPasswordHasher";

/** ตรวจ credential แล้วคืน User (ไม่มี field ลับ) — null ถ้าไม่ผ่าน */
export class LoginUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(email: string, password: string): Promise<User | null> {
    const record = await this.users.findByEmailWithSecret(normalizeEmail(email));
    if (!record || !record.isActive) return null;
    const ok = await this.hasher.compare(password, record.passwordHash);
    if (!ok) return null;
    const { passwordHash: _omit, ...user } = record; // ตัด field ลับก่อนคืน
    void _omit;
    return user;
  }
}
