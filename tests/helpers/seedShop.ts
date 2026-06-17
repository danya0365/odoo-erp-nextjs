// seed shop + owner ลง test db — คืน id ไว้ scope ใน test
import bcrypt from "bcryptjs";
import * as schema from "@/src/infrastructure/db/schema";
import type { TestDb } from "./withTestDb";

export interface SeededShop {
  shopId: string;
  ownerId: string;
  slug: string;
}

export async function seedShop(
  db: TestDb["db"],
  slug: string,
  ownerEmail: string,
): Promise<SeededShop> {
  const [shop] = await db
    .insert(schema.shops)
    .values({ name: `Shop ${slug}`, slug })
    .returning();
  const [owner] = await db
    .insert(schema.users)
    .values({
      shopId: shop.id,
      email: ownerEmail,
      passwordHash: await bcrypt.hash("owner1234", 4),
      name: `Owner ${slug}`,
      role: "shop_owner",
    })
    .returning();
  return { shopId: shop.id, ownerId: owner.id, slug };
}
