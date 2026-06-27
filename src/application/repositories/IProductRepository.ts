import type { Product, ProductType } from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreateProductInput {
  shopId: string;
  sku: string;
  name: string;
  type: ProductType;
  salePrice: number; // minor
  costPrice: number; // minor
  taxRateBp: number;
  uom: string;
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, "shopId">>;

export interface IProductRepository {
  create(input: CreateProductInput): Promise<Product>;
  findById(shopId: string, id: string): Promise<Product | null>;
  findBySku(shopId: string, sku: string): Promise<Product | null>;
  list(shopId: string, query: PageQuery): Promise<Page<Product>>;
  /** สินค้าที่ใช้งานอยู่ทั้งหมด (สำหรับ select) — filter ใน SQL */
  listActive(shopId: string): Promise<Product[]>;
  /** สินค้าที่ใช้งานอยู่ + ประเภท stockable (สำหรับนับสต๊อก/ล็อต) */
  listStockable(shopId: string): Promise<Product[]>;
  update(shopId: string, id: string, input: UpdateProductInput): Promise<Product>;
  setActive(shopId: string, id: string, isActive: boolean): Promise<Product>;
}
