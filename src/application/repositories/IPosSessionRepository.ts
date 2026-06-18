import type { PosSession } from "@/src/domain/entities";

export interface OpenSessionInput {
  shopId: string;
  userId: string;
  openingCash: number;
  openedAt: string;
}

export interface CloseSessionPatch {
  closingCash: number;
  expectedCash: number;
  difference: number;
  closedAt: string;
}

export interface IPosSessionRepository {
  open(input: OpenSessionInput): Promise<PosSession>;
  findById(shopId: string, id: string): Promise<PosSession | null>;
  /** กะที่ยังเปิดอยู่ของ shop (MVP: หนึ่งกะต่อ shop) */
  findOpen(shopId: string): Promise<PosSession | null>;
  list(shopId: string): Promise<PosSession[]>;
  close(shopId: string, id: string, patch: CloseSessionPatch): Promise<PosSession>;
}
