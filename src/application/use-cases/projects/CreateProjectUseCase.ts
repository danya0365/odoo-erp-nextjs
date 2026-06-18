import type { Project } from "@/src/domain/entities";
import type { IProjectRepository } from "@/src/application/repositories/IProjectRepository";

/** สร้างโครงการใหม่ */
export class CreateProjectUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(shopId: string, name: string, customerId: string | null): Promise<Project> {
    if (!name?.trim()) throw new Error("กรุณาระบุชื่อโครงการ");
    return this.projects.create({ shopId, name: name.trim(), customerId });
  }
}
