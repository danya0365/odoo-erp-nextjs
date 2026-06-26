import "server-only";
import { and, eq, desc, count } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { VendorBill, VendorBillLine } from "@/src/domain/entities";
import type {
  CreateVendorBillInput,
  IVendorBillRepository,
} from "@/src/application/repositories/IVendorBillRepository";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";
import { toOffsetLimit } from "@/src/application/repositories/pagination";

type Row = typeof schema.vendorBills.$inferSelect;

function toBill(row: Row): VendorBill {
  return {
    id: row.id,
    shopId: row.shopId,
    docNumber: row.docNumber,
    purchaseOrderId: row.purchaseOrderId,
    vendorId: row.vendorId,
    status: row.status,
    currency: row.currency,
    untaxedAmount: row.untaxedAmount,
    taxAmount: row.taxAmount,
    totalAmount: row.totalAmount,
    amountPaid: row.amountPaid,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleVendorBillRepository implements IVendorBillRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async createWithLines(input: CreateVendorBillInput): Promise<VendorBill> {
    return this.db.transaction(async (tx) => {
      const [bill] = await tx
        .insert(schema.vendorBills)
        .values({
          shopId: input.shopId,
          docNumber: input.docNumber,
          purchaseOrderId: input.purchaseOrderId,
          vendorId: input.vendorId,
          status: input.status,
          currency: input.currency,
          untaxedAmount: input.untaxedAmount,
          taxAmount: input.taxAmount,
          totalAmount: input.totalAmount,
        })
        .returning();
      if (input.lines.length > 0) {
        await tx.insert(schema.vendorBillLines).values(
          input.lines.map((l) => ({
            shopId: input.shopId,
            vendorBillId: bill.id,
            productId: l.productId,
            description: l.description,
            qty: l.qty,
            unitPrice: l.unitPrice,
            taxRateBp: l.taxRateBp,
            lineSubtotal: l.lineSubtotal,
            lineTax: l.lineTax,
            lineTotal: l.lineTotal,
          })),
        );
      }
      return toBill(bill);
    });
  }

  async findById(shopId: string, id: string): Promise<VendorBill | null> {
    const row = await this.db.query.vendorBills.findFirst({
      where: and(eq(schema.vendorBills.shopId, shopId), eq(schema.vendorBills.id, id)),
    });
    return row ? toBill(row) : null;
  }

  async listLines(shopId: string, vendorBillId: string): Promise<VendorBillLine[]> {
    const rows = await this.db
      .select()
      .from(schema.vendorBillLines)
      .where(
        and(
          eq(schema.vendorBillLines.shopId, shopId),
          eq(schema.vendorBillLines.vendorBillId, vendorBillId),
        ),
      );
    return rows.map((r) => ({
      id: r.id,
      shopId: r.shopId,
      vendorBillId: r.vendorBillId,
      productId: r.productId,
      description: r.description,
      qty: r.qty,
      unitPrice: r.unitPrice,
      taxRateBp: r.taxRateBp,
      lineSubtotal: r.lineSubtotal,
      lineTax: r.lineTax,
      lineTotal: r.lineTotal,
    }));
  }

  async listByPurchaseOrder(
    shopId: string,
    purchaseOrderId: string,
  ): Promise<VendorBill[]> {
    const rows = await this.db
      .select()
      .from(schema.vendorBills)
      .where(
        and(
          eq(schema.vendorBills.shopId, shopId),
          eq(schema.vendorBills.purchaseOrderId, purchaseOrderId),
        ),
      )
      .orderBy(desc(schema.vendorBills.createdAt));
    return rows.map(toBill);
  }

  async list(shopId: string, query: PageQuery): Promise<Page<VendorBill>> {
    const { offset, limit } = toOffsetLimit(query);
    const where = eq(schema.vendorBills.shopId, shopId);
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(schema.vendorBills)
        .where(where)
        .orderBy(desc(schema.vendorBills.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.vendorBills).where(where),
    ]);
    return { items: items.map(toBill), total, page: query.page, pageSize: limit };
  }

  async update(
    shopId: string,
    id: string,
    patch: { status?: VendorBill["status"]; amountPaid?: number },
  ): Promise<VendorBill> {
    const [row] = await this.db
      .update(schema.vendorBills)
      .set({
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.amountPaid !== undefined && { amountPaid: patch.amountPaid }),
      })
      .where(and(eq(schema.vendorBills.shopId, shopId), eq(schema.vendorBills.id, id)))
      .returning();
    return toBill(row);
  }
}
