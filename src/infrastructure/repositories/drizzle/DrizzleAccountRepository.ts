import "server-only";
import { and, asc, eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Account } from "@/src/domain/entities";
import { DEFAULT_ACCOUNTS } from "@/src/domain/services/accounting";
import type {
  CreateAccountInput,
  IAccountRepository,
} from "@/src/application/repositories/IAccountRepository";

type Row = typeof schema.accounts.$inferSelect;

function toAccount(row: Row): Account {
  return {
    id: row.id,
    shopId: row.shopId,
    code: row.code,
    name: row.name,
    type: row.type,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleAccountRepository implements IAccountRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async ensureDefaults(shopId: string): Promise<Account[]> {
    const existing = await this.list(shopId);
    if (existing.length > 0) return existing;
    await this.db
      .insert(schema.accounts)
      .values(DEFAULT_ACCOUNTS.map((a) => ({ shopId, code: a.code, name: a.name, type: a.type })))
      .onConflictDoNothing();
    return this.list(shopId);
  }

  async list(shopId: string): Promise<Account[]> {
    const rows = await this.db
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.shopId, shopId))
      .orderBy(asc(schema.accounts.code));
    return rows.map(toAccount);
  }

  async findByCode(shopId: string, code: string): Promise<Account | null> {
    const row = await this.db.query.accounts.findFirst({
      where: and(eq(schema.accounts.shopId, shopId), eq(schema.accounts.code, code)),
    });
    return row ? toAccount(row) : null;
  }

  async codeMap(shopId: string): Promise<Map<string, Account>> {
    const rows = await this.list(shopId);
    return new Map(rows.map((a) => [a.code, a]));
  }

  async create(input: CreateAccountInput): Promise<Account> {
    const [row] = await this.db
      .insert(schema.accounts)
      .values({ shopId: input.shopId, code: input.code, name: input.name, type: input.type })
      .returning();
    return toAccount(row);
  }
}
