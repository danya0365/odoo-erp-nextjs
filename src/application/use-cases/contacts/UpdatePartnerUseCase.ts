import type { Partner } from "@/src/domain/entities";
import { normalizeEmail } from "@/src/domain/services/email";
import type {
  UpdatePartnerInput,
  IPartnerRepository,
} from "@/src/application/repositories/IPartnerRepository";

export class UpdatePartnerUseCase {
  constructor(private readonly partners: IPartnerRepository) {}

  async execute(
    shopId: string,
    id: string,
    input: UpdatePartnerInput,
  ): Promise<Partner> {
    const existing = await this.partners.findById(shopId, id);
    if (!existing) throw new Error("ไม่พบผู้ติดต่อ");

    const patch: UpdatePartnerInput = { ...input };
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) throw new Error("กรุณาระบุชื่อผู้ติดต่อ");
      patch.name = name;
    }
    if (patch.email !== undefined) {
      patch.email = patch.email ? normalizeEmail(patch.email) : null;
    }
    return this.partners.update(shopId, id, patch);
  }
}
