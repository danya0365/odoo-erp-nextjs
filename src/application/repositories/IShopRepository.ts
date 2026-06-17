import type { Shop } from "@/src/domain/entities";

export interface CreateShopInput {
  name: string;
  slug: string;
}

export interface IShopRepository {
  create(input: CreateShopInput): Promise<Shop>;
  findById(id: string): Promise<Shop | null>;
  findBySlug(slug: string): Promise<Shop | null>;
}
