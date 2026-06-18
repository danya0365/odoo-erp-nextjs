import type { OnlineOrder } from "@/src/domain/entities";

export interface CreateOnlineOrderInput {
  shopId: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string | null;
  salesOrderId: string;
  totalAmount: number;
}

export interface IOnlineOrderRepository {
  create(input: CreateOnlineOrderInput): Promise<OnlineOrder>;
  findById(shopId: string, id: string): Promise<OnlineOrder | null>;
  list(shopId: string): Promise<OnlineOrder[]>;
}
