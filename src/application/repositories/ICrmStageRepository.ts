import type { CrmStage } from "@/src/domain/entities";

export interface ICrmStageRepository {
  /** สร้าง pipeline มาตรฐานถ้ายังไม่มี (idempotent) แล้วคืนทั้งหมด เรียงตาม sequence */
  ensureDefaults(shopId: string): Promise<CrmStage[]>;
  list(shopId: string): Promise<CrmStage[]>;
  findById(shopId: string, id: string): Promise<CrmStage | null>;
}
