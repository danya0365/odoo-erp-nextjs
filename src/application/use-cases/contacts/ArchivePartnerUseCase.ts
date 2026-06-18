import type { Partner } from "@/src/domain/entities";
import type { IPartnerRepository } from "@/src/application/repositories/IPartnerRepository";

export class ArchivePartnerUseCase {
  constructor(private readonly partners: IPartnerRepository) {}

  async execute(shopId: string, id: string, isActive: boolean): Promise<Partner> {
    const existing = await this.partners.findById(shopId, id);
    if (!existing) throw new Error("ไม่พบผู้ติดต่อ");
    return this.partners.setActive(shopId, id, isActive);
  }
}
