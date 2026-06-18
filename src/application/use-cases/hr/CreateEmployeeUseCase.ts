import type { Employee } from "@/src/domain/entities";
import type { IEmployeeRepository } from "@/src/application/repositories/IEmployeeRepository";

/** เพิ่มพนักงาน */
export class CreateEmployeeUseCase {
  constructor(private readonly employees: IEmployeeRepository) {}

  async execute(
    shopId: string,
    name: string,
    position: string | null,
    baseSalary: number,
  ): Promise<Employee> {
    if (!name?.trim()) throw new Error("กรุณาระบุชื่อพนักงาน");
    if (baseSalary < 0) throw new Error("เงินเดือนต้องไม่ติดลบ");
    return this.employees.create({ shopId, name: name.trim(), position, baseSalary });
  }
}
