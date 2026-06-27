import "server-only";
import { eq, desc } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { DunningLog } from "@/src/domain/entities";
import type {
  CreateDunningLogInput,
  IDunningLogRepository,
} from "@/src/application/repositories/IDunningLogRepository";

type Row = typeof schema.dunningLogs.$inferSelect;

function toLog(row: Row): DunningLog {
  return {
    id: row.id,
    shopId: row.shopId,
    customerId: row.customerId,
    amount: row.amount,
    note: row.note,
    sentAt: row.sentAt,
    createdAt: row.createdAt,
  };
}

export class DrizzleDunningLogRepository implements IDunningLogRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateDunningLogInput): Promise<DunningLog> {
    const [row] = await this.db.insert(schema.dunningLogs).values(input).returning();
    return toLog(row);
  }

  async latestByCustomer(shopId: string): Promise<Map<string, string>> {
    const rows = await this.db
      .select()
      .from(schema.dunningLogs)
      .where(eq(schema.dunningLogs.shopId, shopId))
      .orderBy(desc(schema.dunningLogs.sentAt));
    const map = new Map<string, string>();
    for (const r of rows) {
      if (!map.has(r.customerId)) map.set(r.customerId, r.sentAt); // อันแรก = ล่าสุด
    }
    return map;
  }
}
