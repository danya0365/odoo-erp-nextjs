import type { ServiceTicket, ServiceTicketStatus } from "@/src/domain/entities";
import type { Page, PageQuery } from "@/src/application/repositories/pagination";

export interface CreateServiceTicketInput {
  shopId: string;
  docNumber: string;
  customerId: string;
  subject: string;
  description: string;
}

export interface IServiceTicketRepository {
  create(input: CreateServiceTicketInput): Promise<ServiceTicket>;
  findById(shopId: string, id: string): Promise<ServiceTicket | null>;
  list(shopId: string, query: PageQuery): Promise<Page<ServiceTicket>>;
  update(
    shopId: string,
    id: string,
    patch: { status?: ServiceTicketStatus; assigneeId?: string | null; scheduledAt?: string | null },
  ): Promise<ServiceTicket>;
}
