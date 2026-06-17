import "server-only";
import { eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Session, User } from "@/src/domain/entities";
import type {
  CreateSessionInput,
  ISessionRepository,
} from "@/src/application/repositories/ISessionRepository";

type SessionRow = typeof schema.sessions.$inferSelect;
type UserRow = typeof schema.users.$inferSelect;

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.userId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    shopId: row.shopId,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSessionRepository implements ISessionRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateSessionInput): Promise<Session> {
    const [row] = await this.db
      .insert(schema.sessions)
      .values({ userId: input.userId, expiresAt: input.expiresAt })
      .returning();
    return toSession(row);
  }

  async findValid(
    token: string,
    now: Date,
  ): Promise<{ session: Session; user: User } | null> {
    const [row] = await this.db
      .select({ session: schema.sessions, user: schema.users })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
      .where(eq(schema.sessions.id, token))
      .limit(1);
    if (!row) return null;
    if (new Date(row.session.expiresAt).getTime() <= now.getTime()) return null;
    if (!row.user.isActive) return null;
    return { session: toSession(row.session), user: toUser(row.user) };
  }

  async delete(token: string): Promise<void> {
    await this.db.delete(schema.sessions).where(eq(schema.sessions.id, token));
  }
}
