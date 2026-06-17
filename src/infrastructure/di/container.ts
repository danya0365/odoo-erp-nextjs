import "server-only";

import { DrizzleUserRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleUserRepository";
import { DrizzleShopRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopRepository";
import { DrizzleSessionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSessionRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { BcryptPasswordHasher } from "@/src/infrastructure/services/BcryptPasswordHasher";

import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { ISessionRepository } from "@/src/application/repositories/ISessionRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";
import type { IPasswordHasher } from "@/src/application/services/IPasswordHasher";

/**
 * Composition root ฝั่ง server: singleton ของ repo + service ที่ wire impl จริงไว้.
 * สลับ implementation — แก้ "ที่นี่ที่เดียว" ไม่ต้องแตะ use case.
 */
class Container {
  readonly userRepository: IUserRepository = new DrizzleUserRepository();
  readonly shopRepository: IShopRepository = new DrizzleShopRepository();
  readonly sessionRepository: ISessionRepository = new DrizzleSessionRepository();
  readonly sequenceRepository: ISequenceRepository = new DrizzleSequenceRepository();
  readonly passwordHasher: IPasswordHasher = new BcryptPasswordHasher();
}

// cache บน globalThis เพื่อกัน leak ตอน HMR ใน dev
const g = globalThis as unknown as { __container?: Container };
export const container = g.__container ?? new Container();
if (process.env.NODE_ENV !== "production") g.__container = container;
