import type { Account, AccountType } from "@/src/domain/entities";

export interface CreateAccountInput {
  shopId: string;
  code: string;
  name: string;
  type: AccountType;
}

export interface IAccountRepository {
  /** สร้างผังบัญชีมาตรฐานถ้ายังไม่มี (idempotent) แล้วคืนทั้งหมด */
  ensureDefaults(shopId: string): Promise<Account[]>;
  list(shopId: string): Promise<Account[]>;
  findByCode(shopId: string, code: string): Promise<Account | null>;
  /** map code → Account (หลัง ensureDefaults) สำหรับ resolve ตอน post */
  codeMap(shopId: string): Promise<Map<string, Account>>;
  create(input: CreateAccountInput): Promise<Account>;
}
