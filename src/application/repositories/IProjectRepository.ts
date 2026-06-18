import type { Project, ProjectStatus } from "@/src/domain/entities";

export interface CreateProjectInput {
  shopId: string;
  name: string;
  customerId?: string | null;
}

export interface IProjectRepository {
  create(input: CreateProjectInput): Promise<Project>;
  findById(shopId: string, id: string): Promise<Project | null>;
  list(shopId: string): Promise<Project[]>;
  setStatus(shopId: string, id: string, status: ProjectStatus): Promise<Project>;
}
