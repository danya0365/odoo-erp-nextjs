import "server-only";
import { and, asc, eq } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { Employee } from "@/src/domain/entities";
import type {
  CreateEmployeeInput,
  IEmployeeRepository,
} from "@/src/application/repositories/IEmployeeRepository";

type Row = typeof schema.employees.$inferSelect;

function toEmployee(row: Row): Employee {
  return {
    id: row.id,
    shopId: row.shopId,
    name: row.name,
    position: row.position,
    baseSalary: row.baseSalary,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleEmployeeRepository implements IEmployeeRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async create(input: CreateEmployeeInput): Promise<Employee> {
    const [row] = await this.db
      .insert(schema.employees)
      .values({
        shopId: input.shopId,
        name: input.name,
        position: input.position ?? null,
        baseSalary: input.baseSalary,
      })
      .returning();
    return toEmployee(row);
  }

  async findById(shopId: string, id: string): Promise<Employee | null> {
    const row = await this.db.query.employees.findFirst({
      where: and(eq(schema.employees.shopId, shopId), eq(schema.employees.id, id)),
    });
    return row ? toEmployee(row) : null;
  }

  async list(shopId: string): Promise<Employee[]> {
    const rows = await this.db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.shopId, shopId))
      .orderBy(asc(schema.employees.name));
    return rows.map(toEmployee);
  }

  async listActive(shopId: string): Promise<Employee[]> {
    const rows = await this.db
      .select()
      .from(schema.employees)
      .where(and(eq(schema.employees.shopId, shopId), eq(schema.employees.isActive, true)))
      .orderBy(asc(schema.employees.name));
    return rows.map(toEmployee);
  }

  async setActive(shopId: string, id: string, isActive: boolean): Promise<Employee> {
    const [row] = await this.db
      .update(schema.employees)
      .set({ isActive })
      .where(and(eq(schema.employees.shopId, shopId), eq(schema.employees.id, id)))
      .returning();
    return toEmployee(row);
  }
}
