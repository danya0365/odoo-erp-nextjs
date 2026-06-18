import type { Journal, JournalType } from "@/src/domain/entities";

export interface IJournalRepository {
  /** สร้างสมุดรายวันมาตรฐานถ้ายังไม่มี (idempotent) แล้วคืนทั้งหมด */
  ensureDefaults(shopId: string): Promise<Journal[]>;
  list(shopId: string): Promise<Journal[]>;
  findByType(shopId: string, type: JournalType): Promise<Journal | null>;
}
