import type { Partner } from "@/src/domain/entities";
import { normalizeEmail } from "@/src/domain/services/email";
import type {
  CreatePartnerInput,
  IPartnerRepository,
} from "@/src/application/repositories/IPartnerRepository";

export class CreatePartnerUseCase {
  constructor(private readonly partners: IPartnerRepository) {}

  async execute(input: CreatePartnerInput): Promise<Partner> {
    const name = input.name.trim();
    if (!name) throw new Error("กรุณาระบุชื่อผู้ติดต่อ");
    return this.partners.create({
      ...input,
      name,
      email: input.email ? normalizeEmail(input.email) : null,
    });
  }
}
