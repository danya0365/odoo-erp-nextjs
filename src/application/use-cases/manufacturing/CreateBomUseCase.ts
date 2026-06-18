import type { Bom } from "@/src/domain/entities";
import type { IBomRepository } from "@/src/application/repositories/IBomRepository";
import type { IProductRepository } from "@/src/application/repositories/IProductRepository";

export interface CreateBomParams {
  shopId: string;
  productId: string;
  name: string;
  lines: { componentId: string; qtyPerUnit: number }[];
}

/** สร้างสูตรการผลิต (BOM) — สินค้าสำเร็จรูป + วัตถุดิบ */
export class CreateBomUseCase {
  constructor(
    private readonly boms: IBomRepository,
    private readonly products: IProductRepository,
  ) {}

  async execute(p: CreateBomParams): Promise<Bom> {
    if (!p.name?.trim()) throw new Error("กรุณาระบุชื่อสูตร");
    if (p.lines.length === 0) throw new Error("ต้องมีวัตถุดิบอย่างน้อย 1 รายการ");

    const product = await this.products.findById(p.shopId, p.productId);
    if (!product) throw new Error("ไม่พบสินค้าสำเร็จรูป");

    for (const l of p.lines) {
      if (l.qtyPerUnit <= 0) throw new Error("จำนวนวัตถุดิบต้องมากกว่า 0");
      if (l.componentId === p.productId) throw new Error("วัตถุดิบต้องไม่ใช่สินค้าสำเร็จรูปตัวเอง");
      const c = await this.products.findById(p.shopId, l.componentId);
      if (!c) throw new Error("ไม่พบวัตถุดิบในรายการ");
    }

    return this.boms.createWithLines({
      shopId: p.shopId,
      productId: p.productId,
      name: p.name.trim(),
      lines: p.lines,
    });
  }
}
