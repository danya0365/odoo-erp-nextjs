import "server-only";
import { and, desc, eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Opportunity } from "@/src/domain/entities";
import type {
  CreateOpportunityInput,
  IOpportunityRepository,
  OpportunityPatch,
} from "@/src/application/repositories/IOpportunityRepository";

type Row = typeof schema.opportunities.$inferSelect;

function toOpportunity(row: Row): Opportunity {
  return {
    id: row.id,
    shopId: row.shopId,
    name: row.name,
    partnerId: row.partnerId,
    contactName: row.contactName,
    email: row.email,
    phone: row.phone,
    expectedRevenue: row.expectedRevenue,
    probability: row.probability,
    stageId: row.stageId,
    status: row.status,
    lostReason: row.lostReason,
    salesOrderId: row.salesOrderId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleOpportunityRepository implements IOpportunityRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateOpportunityInput): Promise<Opportunity> {
    const [row] = await this.db
      .insert(schema.opportunities)
      .values({
        shopId: input.shopId,
        name: input.name,
        partnerId: input.partnerId ?? null,
        contactName: input.contactName ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        expectedRevenue: input.expectedRevenue,
        probability: input.probability,
        stageId: input.stageId,
      })
      .returning();
    return toOpportunity(row);
  }

  async findById(shopId: string, id: string): Promise<Opportunity | null> {
    const row = await this.db.query.opportunities.findFirst({
      where: and(
        eq(schema.opportunities.shopId, shopId),
        eq(schema.opportunities.id, id),
      ),
    });
    return row ? toOpportunity(row) : null;
  }

  async listAll(shopId: string): Promise<Opportunity[]> {
    const rows = await this.db
      .select()
      .from(schema.opportunities)
      .where(eq(schema.opportunities.shopId, shopId))
      .orderBy(desc(schema.opportunities.createdAt));
    return rows.map(toOpportunity);
  }

  async update(shopId: string, id: string, patch: OpportunityPatch): Promise<Opportunity> {
    const [row] = await this.db
      .update(schema.opportunities)
      .set({
        ...(patch.stageId !== undefined && { stageId: patch.stageId }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.probability !== undefined && { probability: patch.probability }),
        ...(patch.expectedRevenue !== undefined && { expectedRevenue: patch.expectedRevenue }),
        ...(patch.lostReason !== undefined && { lostReason: patch.lostReason }),
        ...(patch.salesOrderId !== undefined && { salesOrderId: patch.salesOrderId }),
      })
      .where(
        and(eq(schema.opportunities.shopId, shopId), eq(schema.opportunities.id, id)),
      )
      .returning();
    return toOpportunity(row);
  }
}
