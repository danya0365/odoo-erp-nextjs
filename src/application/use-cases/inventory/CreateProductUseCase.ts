import type { Product } from "@/src/domain/entities";
import type {
  CreateProductInput,
  IProductRepository,
} from "@/src/application/repositories/IProductRepository";

export class CreateProductUseCase {
  constructor(private readonly products: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const sku = input.sku.trim();
    const name = input.name.trim();
    if (!sku) throw new Error("กรุณาระบุรหัสสินค้า (SKU)");
    if (!name) throw new Error("กรุณาระบุชื่อสินค้า");
    if (await this.products.findBySku(input.shopId, sku)) {
      throw new Error("รหัสสินค้า (SKU) นี้ถูกใช้แล้ว");
    }
    return this.products.create({ ...input, sku, name });
  }
}
