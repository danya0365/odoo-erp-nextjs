import type { Shop, User } from "@/src/domain/entities";
import { normalizeEmail } from "@/src/domain/services/email";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { IPasswordHasher } from "@/src/application/services/IPasswordHasher";

export interface RegisterShopInput {
  shopName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}

/** สร้าง tenant (shop) + เจ้าของร้าน (shop_owner) พร้อมเช็ค uniqueness — business rule รวมที่นี่ */
export class RegisterShopUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(input: RegisterShopInput): Promise<{ shop: Shop; owner: User }> {
    const email = normalizeEmail(input.ownerEmail);

    if (await this.shops.findBySlug(input.slug)) {
      throw new Error("slug นี้ถูกใช้แล้ว");
    }
    if (await this.users.findByEmailWithSecret(email)) {
      throw new Error("อีเมลนี้ถูกใช้แล้ว");
    }

    const shop = await this.shops.create({ name: input.shopName, slug: input.slug });
    const owner = await this.users.create({
      shopId: shop.id,
      email,
      passwordHash: await this.hasher.hash(input.ownerPassword),
      name: input.ownerName,
      role: "shop_owner",
    });
    return { shop, owner };
  }
}
