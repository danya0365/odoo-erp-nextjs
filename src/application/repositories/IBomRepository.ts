import type { Bom, BomWithLines } from "@/src/domain/entities";

export interface CreateBomLineInput {
  componentId: string;
  qtyPerUnit: number;
}

export interface CreateBomInput {
  shopId: string;
  productId: string;
  name: string;
  lines: CreateBomLineInput[];
}

export interface IBomRepository {
  createWithLines(input: CreateBomInput): Promise<Bom>;
  findById(shopId: string, id: string): Promise<BomWithLines | null>;
  list(shopId: string): Promise<Bom[]>;
}
