import type { ManufacturingOrder, ManufacturingOrderStatus } from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreateManufacturingOrderInput {
  shopId: string;
  bomId: string;
  productId: string;
  qty: number;
}

export interface ManufacturingOrderPatch {
  docNumber?: string;
  status?: ManufacturingOrderStatus;
}

export interface IManufacturingOrderRepository {
  create(input: CreateManufacturingOrderInput): Promise<ManufacturingOrder>;
  findById(shopId: string, id: string): Promise<ManufacturingOrder | null>;
  list(shopId: string, query: PageQuery): Promise<Page<ManufacturingOrder>>;
  update(shopId: string, id: string, patch: ManufacturingOrderPatch): Promise<ManufacturingOrder>;
}
