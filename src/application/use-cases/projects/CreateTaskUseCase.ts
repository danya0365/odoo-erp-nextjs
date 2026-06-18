import type { ProjectTask } from "@/src/domain/entities";
import type { IProjectRepository } from "@/src/application/repositories/IProjectRepository";
import type { IProjectTaskRepository } from "@/src/application/repositories/IProjectTaskRepository";

/** เพิ่มงานย่อยในโครงการ (โครงการต้องเปิดอยู่) */
export class CreateTaskUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly tasks: IProjectTaskRepository,
  ) {}

  async execute(shopId: string, projectId: string, name: string): Promise<ProjectTask> {
    if (!name?.trim()) throw new Error("กรุณาระบุชื่องาน");
    const project = await this.projects.findById(shopId, projectId);
    if (!project) throw new Error("ไม่พบโครงการ");
    if (project.status === "closed") throw new Error("โครงการปิดแล้ว เพิ่มงานไม่ได้");
    return this.tasks.create({ shopId, projectId, name: name.trim() });
  }
}
