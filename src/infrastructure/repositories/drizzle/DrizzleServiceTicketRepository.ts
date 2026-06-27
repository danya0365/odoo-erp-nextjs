import "server-only";
import { and, eq, desc, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { ServiceTicket } from "@/src/domain/entities";
import type {
  CreateServiceTicketInput,
  IServiceTicketRepository,
} from "@/src/application/repositories/IServiceTicketRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

function toTicket(r: typeof schema.serviceTickets.$inferSelect): ServiceTicket {
  return {
    id: r.id, shopId: r.shopId, docNumber: r.docNumber, customerId: r.customerId,
    subject: r.subject, description: r.description, status: r.status,
    assigneeId: r.assigneeId, scheduledAt: r.scheduledAt, createdAt: r.createdAt, updatedAt: r.updatedAt,
  };
}

export class DrizzleServiceTicketRepository implements IServiceTicketRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateServiceTicketInput): Promise<ServiceTicket> {
    const [row] = await this.db.insert(schema.serviceTickets).values(input).returning();
    return toTicket(row);
  }

  async findById(shopId: string, id: string): Promise<ServiceTicket | null> {
    const row = await this.db.query.serviceTickets.findFirst({
      where: and(eq(schema.serviceTickets.shopId, shopId), eq(schema.serviceTickets.id, id)),
    });
    return row ? toTicket(row) : null;
  }

  async list(shopId: string, query: PageQuery): Promise<Page<ServiceTicket>> {
    const { offset, limit } = toOffsetLimit(query);
    const where = eq(schema.serviceTickets.shopId, shopId);
    const [items, [{ total }]] = await Promise.all([
      this.db.select().from(schema.serviceTickets).where(where).orderBy(desc(schema.serviceTickets.createdAt)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(schema.serviceTickets).where(where),
    ]);
    return { items: items.map(toTicket), total, page: query.page, pageSize: limit };
  }

  async update(
    shopId: string,
    id: string,
    patch: { status?: ServiceTicket["status"]; assigneeId?: string | null; scheduledAt?: string | null },
  ): Promise<ServiceTicket> {
    const [row] = await this.db
      .update(schema.serviceTickets)
      .set({
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.assigneeId !== undefined && { assigneeId: patch.assigneeId }),
        ...(patch.scheduledAt !== undefined && { scheduledAt: patch.scheduledAt }),
      })
      .where(and(eq(schema.serviceTickets.shopId, shopId), eq(schema.serviceTickets.id, id)))
      .returning();
    return toTicket(row);
  }
}
