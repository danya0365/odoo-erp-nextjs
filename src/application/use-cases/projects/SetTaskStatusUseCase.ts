import type { ProjectTask, TaskStatus } from "@/src/domain/entities";
import type { IProjectTaskRepository } from "@/src/application/repositories/IProjectTaskRepository";

const VALID: TaskStatus[] = ["todo", "in_progress", "done"];

/** เปลี่ยนสถานะงาน (todo/in_progress/done) */
export class SetTaskStatusUseCase {
  constructor(private readonly tasks: IProjectTaskRepository) {}

  async execute(shopId: string, taskId: string, status: TaskStatus): Promise<ProjectTask> {
    if (!VALID.includes(status)) throw new Error("สถานะงานไม่ถูกต้อง");
    const task = await this.tasks.findById(shopId, taskId);
    if (!task) throw new Error("ไม่พบงาน");
    return this.tasks.setStatus(shopId, taskId, status);
  }
}
