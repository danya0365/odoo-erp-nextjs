import type { Product } from "@/src/domain/entities";
import type {
  UpdateProductInput,
  IProductRepository,
} from "@/src/application/repositories/IProductRepository";

export class UpdateProductUseCase {
  constructor(private readonly products: IProductRepository) {}

  async execute(
    shopId: string,
    id: string,
    input: UpdateProductInput,
  ): Promise<Product> {
    const existing = await this.products.findById(shopId, id);
    if (!existing) throw new Error("ไม่พบสินค้า");

    const patch: UpdateProductInput = { ...input };
    if (patch.sku !== undefined) {
      const sku = patch.sku.trim();
      if (!sku) throw new Error("กรุณาระบุรหัสสินค้า (SKU)");
      const dup = await this.products.findBySku(shopId, sku);
      if (dup && dup.id !== id) throw new Error("รหัสสินค้า (SKU) นี้ถูกใช้แล้ว");
      patch.sku = sku;
    }
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) throw new Error("กรุณาระบุชื่อสินค้า");
      patch.name = name;
    }
    return this.products.update(shopId, id, patch);
  }
}
