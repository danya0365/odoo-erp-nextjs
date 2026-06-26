import type { StockCount, StockCountWithLines, StockCountStatus } from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreateStockCountLineInput {
  productId: string;
  systemQty: number;
  countedQty: number;
}

export interface CreateStockCountInput {
  shopId: string;
  docNumber: string;
  note: string | null;
  lines: CreateStockCountLineInput[];
}

export interface IStockCountRepository {
  createWithLines(input: CreateStockCountInput): Promise<StockCount>;
  findById(shopId: string, id: string): Promise<StockCountWithLines | null>;
  list(shopId: string, query: PageQuery): Promise<Page<StockCount>>;
  updateLineCounts(shopId: string, counts: { id: string; countedQty: number }[]): Promise<void>;
  update(shopId: string, id: string, patch: { status?: StockCountStatus }): Promise<StockCount>;
}
