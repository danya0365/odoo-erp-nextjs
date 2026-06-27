import type { Project, ProjectStatus } from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreateProjectInput {
  shopId: string;
  name: string;
  customerId?: string | null;
}

export interface IProjectRepository {
  create(input: CreateProjectInput): Promise<Project>;
  findById(shopId: string, id: string): Promise<Project | null>;
  list(shopId: string, query: PageQuery): Promise<Page<Project>>;
  setStatus(shopId: string, id: string, status: ProjectStatus): Promise<Project>;
}
