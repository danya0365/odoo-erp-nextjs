import "server-only";
import { sql } from "drizzle-orm";

import { db as defaultDb, schema, type Database } from "@/src/infrastructure/db/client";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

export class DrizzleSequenceRepository implements ISequenceRepository {
  constructor(private readonly db: Database = defaultDb) {}

  async next(shopId: string, key: string): Promise<number> {
    // INSERT คืน 1 ครั้งแรก; ครั้งถัดไปชน unique → UPDATE next = next + 1 แล้ว RETURNING
    // libSQL เป็น single-writer จึงปลอดภัยจาก race (ไม่ออกเลขซ้ำ)
    const [row] = await this.db
      .insert(schema.sequences)
      .values({ shopId, key, next: 1 })
      .onConflictDoUpdate({
        target: [schema.sequences.shopId, schema.sequences.key],
        set: { next: sql`${schema.sequences.next} + 1` },
      })
      .returning({ value: schema.sequences.next });
    return row.value;
  }
}
