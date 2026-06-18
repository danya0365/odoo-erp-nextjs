import type { Employee } from "@/src/domain/entities";

export interface CreateEmployeeInput {
  shopId: string;
  name: string;
  position?: string | null;
  baseSalary: number;
}

export interface IEmployeeRepository {
  create(input: CreateEmployeeInput): Promise<Employee>;
  findById(shopId: string, id: string): Promise<Employee | null>;
  list(shopId: string): Promise<Employee[]>;
  listActive(shopId: string): Promise<Employee[]>;
  setActive(shopId: string, id: string, isActive: boolean): Promise<Employee>;
}
