import "server-only";
import { and, asc, eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { CrmStage } from "@/src/domain/entities";
import { DEFAULT_CRM_STAGES } from "@/src/domain/services/crm-status";
import type { ICrmStageRepository } from "@/src/application/repositories/ICrmStageRepository";

type Row = typeof schema.crmStages.$inferSelect;

function toStage(row: Row): CrmStage {
  return {
    id: row.id,
    shopId: row.shopId,
    name: row.name,
    sequence: row.sequence,
    isWon: row.isWon,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleCrmStageRepository implements ICrmStageRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async ensureDefaults(shopId: string): Promise<CrmStage[]> {
    const existing = await this.list(shopId);
    if (existing.length > 0) return existing;
    await this.db
      .insert(schema.crmStages)
      .values(
        DEFAULT_CRM_STAGES.map((s) => ({
          shopId,
          name: s.name,
          sequence: s.sequence,
          isWon: s.isWon,
        })),
      );
    return this.list(shopId);
  }

  async list(shopId: string): Promise<CrmStage[]> {
    const rows = await this.db
      .select()
      .from(schema.crmStages)
      .where(eq(schema.crmStages.shopId, shopId))
      .orderBy(asc(schema.crmStages.sequence));
    return rows.map(toStage);
  }

  async findById(shopId: string, id: string): Promise<CrmStage | null> {
    const row = await this.db.query.crmStages.findFirst({
      where: and(eq(schema.crmStages.shopId, shopId), eq(schema.crmStages.id, id)),
    });
    return row ? toStage(row) : null;
  }
}
