import type { ServiceTicket } from "@/src/domain/entities";
import { canAssign, canClose } from "@/src/domain/services/service-ticket-status";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IServiceTicketRepository } from "@/src/application/repositories/IServiceTicketRepository";
import type { IPartnerRepository } from "@/src/application/repositories/IPartnerRepository";
import type { IEmployeeRepository } from "@/src/application/repositories/IEmployeeRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

/** ลูกค้าแจ้งปัญหา → เปิดใบงานบริการ (open) */
export class CreateServiceTicketUseCase {
  constructor(
    private readonly tickets: IServiceTicketRepository,
    private readonly partners: IPartnerRepository,
    private readonly sequences: ISequenceRepository,
  ) {}
  async execute(shopId: string, customerId: string, subject: string, description: string): Promise<ServiceTicket> {
    const cust = await this.partners.findById(shopId, customerId);
    if (!cust) throw new Error("ไม่พบลูกค้า");
    if (!subject.trim()) throw new Error("กรุณาระบุเรื่อง");
    const seq = await this.sequences.next(shopId, "service_ticket");
    return this.tickets.create({ shopId, docNumber: formatDocNumber("SVC", seq, 5), customerId, subject, description });
  }
}

/** มอบหมายช่าง + นัดหมาย → assigned */
export class AssignServiceTicketUseCase {
  constructor(
    private readonly tickets: IServiceTicketRepository,
    private readonly employees: IEmployeeRepository,
  ) {}
  async execute(shopId: string, id: string, assigneeId: string, scheduledAt: string | null): Promise<ServiceTicket> {
    const ticket = await this.tickets.findById(shopId, id);
    if (!ticket) throw new Error("ไม่พบใบงาน");
    if (!canAssign(ticket.status)) throw new Error("มอบหมายได้เฉพาะงานที่เปิด/กำลังทำ");
    const emp = await this.employees.findById(shopId, assigneeId);
    if (!emp) throw new Error("ไม่พบช่าง/พนักงาน");
    return this.tickets.update(shopId, id, { status: "assigned", assigneeId, scheduledAt });
  }
}

/** ปิดงาน → done */
export class CloseServiceTicketUseCase {
  constructor(private readonly tickets: IServiceTicketRepository) {}
  async execute(shopId: string, id: string): Promise<ServiceTicket> {
    const ticket = await this.tickets.findById(shopId, id);
    if (!ticket) throw new Error("ไม่พบใบงาน");
    if (!canClose(ticket.status)) throw new Error("ปิดงานได้เฉพาะงานที่มอบหมายแล้ว");
    return this.tickets.update(shopId, id, { status: "done" });
  }
}
