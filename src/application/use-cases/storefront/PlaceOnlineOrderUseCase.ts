import type { OnlineOrder } from "@/src/domain/entities";
import { computeLine, sumDocument } from "@/src/domain/services/money";
import { isValidEmail } from "@/src/domain/services/storefront";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { IProductRepository } from "@/src/application/repositories/IProductRepository";
import type { IPartnerRepository } from "@/src/application/repositories/IPartnerRepository";
import type {
  ISalesOrderRepository,
  CreateSalesOrderLineInput,
} from "@/src/application/repositories/ISalesOrderRepository";
import type { IOnlineOrderRepository } from "@/src/application/repositories/IOnlineOrderRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

export interface PlaceOrderInput {
  slug: string;
  customer: { name: string; email: string; phone?: string | null };
  lines: { productId: string; qty: number }[];
  orderDate: string;
}

/**
 * สั่งซื้อจากหน้าร้านออนไลน์ (public, cross-module) — หา/สร้างลูกค้าจากอีเมล,
 * snapshot ราคาจากสินค้า, เปิดใบขาย (draft) เข้า Sales pipeline, บันทึก online order
 */
export class PlaceOnlineOrderUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly products: IProductRepository,
    private readonly partners: IPartnerRepository,
    private readonly salesOrders: ISalesOrderRepository,
    private readonly onlineOrders: IOnlineOrderRepository,
    private readonly sequences: ISequenceRepository,
  ) {}

  async execute(input: PlaceOrderInput): Promise<OnlineOrder> {
    const name = input.customer.name?.trim();
    const email = input.customer.email?.trim();
    if (!name) throw new Error("กรุณาระบุชื่อผู้สั่งซื้อ");
    if (!email || !isValidEmail(email)) throw new Error("อีเมลไม่ถูกต้อง");
    if (input.lines.length === 0) throw new Error("ตะกร้าว่าง");

    const shop = await this.shops.findBySlug(input.slug);
    if (!shop || !shop.isActive) throw new Error("ไม่พบร้านค้า");

    const soLines: CreateSalesOrderLineInput[] = [];
    for (const l of input.lines) {
      if (l.qty <= 0) throw new Error("จำนวนต้องมากกว่า 0");
      const product = await this.products.findById(shop.id, l.productId);
      if (!product || !product.isActive) throw new Error("ไม่พบสินค้าในรายการ");
      const t = computeLine(l.qty, product.salePrice, product.taxRateBp);
      soLines.push({
        productId: product.id,
        description: product.name,
        qtyOrdered: l.qty,
        unitPrice: product.salePrice,
        taxRateBp: product.taxRateBp,
        lineSubtotal: t.subtotal,
        lineTax: t.tax,
        lineTotal: t.total,
      });
    }
    const doc = sumDocument(soLines.map((l) => ({ subtotal: l.lineSubtotal, tax: l.lineTax })));

    // หา/สร้างลูกค้าจากอีเมล (idempotent ต่อ shop)
    const phone = input.customer.phone?.trim() || null;
    let partner = await this.partners.findByEmail(shop.id, email);
    if (!partner) {
      partner = await this.partners.create({
        shopId: shop.id,
        name,
        type: "customer",
        email,
        phone,
      });
    }

    const order = await this.salesOrders.createWithLines({
      shopId: shop.id,
      customerId: partner.id,
      currency: "THB",
      orderDate: input.orderDate,
      note: "สั่งซื้อออนไลน์",
      untaxedAmount: doc.untaxed,
      taxAmount: doc.tax,
      totalAmount: doc.total,
      lines: soLines,
    });

    const seq = await this.sequences.next(shop.id, "online_order");
    return this.onlineOrders.create({
      shopId: shop.id,
      orderNumber: formatDocNumber("WEB", seq, 5),
      customerName: name,
      email,
      phone,
      salesOrderId: order.id,
      totalAmount: doc.total,
    });
  }
}
