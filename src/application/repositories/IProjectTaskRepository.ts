import type { ProjectTask, TaskStatus } from "@/src/domain/entities";

export interface CreateTaskInput {
  shopId: string;
  projectId: string;
  name: string;
}

export interface IProjectTaskRepository {
  create(input: CreateTaskInput): Promise<ProjectTask>;
  findById(shopId: string, id: string): Promise<ProjectTask | null>;
  listByProject(shopId: string, projectId: string): Promise<ProjectTask[]>;
  setStatus(shopId: string, id: string, status: TaskStatus): Promise<ProjectTask>;
}
