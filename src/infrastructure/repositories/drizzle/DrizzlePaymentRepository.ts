import "server-only";
import { and, eq, desc } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Payment } from "@/src/domain/entities";
import type {
  CreatePaymentInput,
  IPaymentRepository,
} from "@/src/application/repositories/IPaymentRepository";

type Row = typeof schema.payments.$inferSelect;

function toPayment(row: Row): Payment {
  return {
    id: row.id,
    shopId: row.shopId,
    docNumber: row.docNumber,
    partnerId: row.partnerId,
    direction: row.direction,
    invoiceId: row.invoiceId,
    vendorBillId: row.vendorBillId,
    amount: row.amount,
    method: row.method,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
  };
}

export class DrizzlePaymentRepository implements IPaymentRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreatePaymentInput): Promise<Payment> {
    const [row] = await this.db
      .insert(schema.payments)
      .values({
        shopId: input.shopId,
        docNumber: input.docNumber,
        partnerId: input.partnerId,
        direction: input.direction,
        invoiceId: input.invoiceId ?? null,
        vendorBillId: input.vendorBillId ?? null,
        amount: input.amount,
        method: input.method,
        paidAt: input.paidAt,
      })
      .returning();
    return toPayment(row);
  }

  async listByInvoice(shopId: string, invoiceId: string): Promise<Payment[]> {
    const rows = await this.db
      .select()
      .from(schema.payments)
      .where(
        and(eq(schema.payments.shopId, shopId), eq(schema.payments.invoiceId, invoiceId)),
      )
      .orderBy(desc(schema.payments.createdAt));
    return rows.map(toPayment);
  }
}
