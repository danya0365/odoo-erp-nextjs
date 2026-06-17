import "server-only";
import { eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { User, UserWithSecret } from "@/src/domain/entities";
import type {
  CreateUserInput,
  IUserRepository,
} from "@/src/application/repositories/IUserRepository";

type Row = typeof schema.users.$inferSelect;

function toUser(row: Row): User {
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

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateUserInput): Promise<User> {
    const [row] = await this.db
      .insert(schema.users)
      .values({
        shopId: input.shopId,
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        role: input.role,
      })
      .returning();
    return toUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    return row ? toUser(row) : null;
  }

  async findByEmailWithSecret(email: string): Promise<UserWithSecret | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    return row ? { ...toUser(row), passwordHash: row.passwordHash } : null;
  }

  async listByShop(shopId: string): Promise<User[]> {
    const rows = await this.db.query.users.findMany({
      where: eq(schema.users.shopId, shopId),
    });
    return rows.map(toUser);
  }

  async setActive(id: string, isActive: boolean): Promise<User> {
    const [row] = await this.db
      .update(schema.users)
      .set({ isActive })
      .where(eq(schema.users.id, id))
      .returning();
    return toUser(row);
  }
}
