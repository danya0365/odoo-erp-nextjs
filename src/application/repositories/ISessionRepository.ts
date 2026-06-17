import type { Session, User } from "@/src/domain/entities";

export interface CreateSessionInput {
  userId: string;
  expiresAt: string; // ISO-8601
}

export interface ISessionRepository {
  create(input: CreateSessionInput): Promise<Session>;
  /** หา session ที่ยังไม่หมดอายุ + join user (null ถ้าไม่เจอ/หมดอายุ) */
  findValid(token: string, now: Date): Promise<{ session: Session; user: User } | null>;
  delete(token: string): Promise<void>;
}
