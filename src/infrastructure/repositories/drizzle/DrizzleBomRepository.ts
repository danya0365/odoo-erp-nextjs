import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Bom, BomLine, BomWithLines } from "@/src/domain/entities";
import type {
  CreateBomInput,
  IBomRepository,
} from "@/src/application/repositories/IBomRepository";

type Row = typeof schema.boms.$inferSelect;
type LineRow = typeof schema.bomLines.$inferSelect;

function toBom(row: Row): Bom {
  return {
    id: row.id,
    shopId: row.shopId,
    productId: row.productId,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toLine(row: LineRow): BomLine {
  return {
    id: row.id,
    shopId: row.shopId,
    bomId: row.bomId,
    componentId: row.componentId,
    qtyPerUnit: row.qtyPerUnit,
  };
}

export class DrizzleBomRepository implements IBomRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async createWithLines(input: CreateBomInput): Promise<Bom> {
    return this.db.transaction(async (tx) => {
      const [bom] = await tx
        .insert(schema.boms)
        .values({ shopId: input.shopId, productId: input.productId, name: input.name })
        .returning();
      if (input.lines.length > 0) {
        await tx.insert(schema.bomLines).values(
          input.lines.map((l) => ({
            shopId: input.shopId,
            bomId: bom.id,
            componentId: l.componentId,
            qtyPerUnit: l.qtyPerUnit,
          })),
        );
      }
      return toBom(bom);
    });
  }

  async findById(shopId: string, id: string): Promise<BomWithLines | null> {
    const bom = await this.db.query.boms.findFirst({
      where: and(eq(schema.boms.shopId, shopId), eq(schema.boms.id, id)),
    });
    if (!bom) return null;
    const lines = await this.db
      .select()
      .from(schema.bomLines)
      .where(and(eq(schema.bomLines.shopId, shopId), eq(schema.bomLines.bomId, id)));
    return { ...toBom(bom), lines: lines.map(toLine) };
  }

  async list(shopId: string): Promise<Bom[]> {
    const rows = await this.db
      .select()
      .from(schema.boms)
      .where(eq(schema.boms.shopId, shopId))
      .orderBy(desc(schema.boms.createdAt), asc(schema.boms.name));
    return rows.map(toBom);
  }
}
