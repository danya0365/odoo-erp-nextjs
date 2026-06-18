import type { Project, ProjectStatus } from "@/src/domain/entities";
import type { IProjectRepository } from "@/src/application/repositories/IProjectRepository";

/** ปิด/เปิดโครงการใหม่ */
export class SetProjectStatusUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(shopId: string, id: string, status: ProjectStatus): Promise<Project> {
    const project = await this.projects.findById(shopId, id);
    if (!project) throw new Error("ไม่พบโครงการ");
    return this.projects.setStatus(shopId, id, status);
  }
}
