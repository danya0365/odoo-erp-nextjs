import type { Partner, PartnerType } from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreatePartnerInput {
  shopId: string;
  name: string;
  type: PartnerType;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  street?: string | null;
  city?: string | null;
  country?: string | null;
  isCompany?: boolean;
  creditTermDays?: number | null;
  parentId?: string | null;
}

export type UpdatePartnerInput = Partial<Omit<CreatePartnerInput, "shopId">>;

export interface IPartnerRepository {
  create(input: CreatePartnerInput): Promise<Partner>;
  /** scope ด้วย shopId เสมอ */
  findById(shopId: string, id: string): Promise<Partner | null>;
  findByEmail(shopId: string, email: string): Promise<Partner | null>;
  list(shopId: string, query: PageQuery): Promise<Page<Partner>>;
  update(shopId: string, id: string, input: UpdatePartnerInput): Promise<Partner>;
  setActive(shopId: string, id: string, isActive: boolean): Promise<Partner>;
}
