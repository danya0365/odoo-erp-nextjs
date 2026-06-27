import "server-only";

import { DrizzleUserRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleUserRepository";
import { DrizzleShopRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopRepository";
import { DrizzleSessionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSessionRepository";
import { DrizzleSequenceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSequenceRepository";
import { DrizzlePartnerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePartnerRepository";
import { DrizzleProductRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductRepository";
import { DrizzleStockLocationRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockLocationRepository";
import { DrizzleStockMoveRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockMoveRepository";
import { DrizzleStockCountRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStockCountRepository";
import { DrizzleProductLotRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProductLotRepository";
import { DrizzleSalesOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSalesOrderRepository";
import { DrizzleInvoiceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleInvoiceRepository";
import { DrizzleSalesReturnRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSalesReturnRepository";
import { DrizzleInstallmentPlanRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleInstallmentPlanRepository";
import { DrizzlePaymentRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePaymentRepository";
import { DrizzlePurchaseOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePurchaseOrderRepository";
import { DrizzleVendorBillRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleVendorBillRepository";
import { DrizzlePurchaseReturnRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePurchaseReturnRepository";
import { DrizzleAccountRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleAccountRepository";
import { DrizzleJournalRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalRepository";
import { DrizzleJournalEntryRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleJournalEntryRepository";
import { DrizzleVatFilingRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleVatFilingRepository";
import { DrizzleDunningLogRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleDunningLogRepository";
import { DrizzleBankStatementRepository, DrizzlePeriodCloseRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleBankReconciliationRepository";
import { DrizzleCrmStageRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleCrmStageRepository";
import { DrizzleOpportunityRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleOpportunityRepository";
import { DrizzleReportingRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleReportingRepository";
import { DrizzleReorderRuleRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleReorderRuleRepository";
import { DrizzlePosSessionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePosSessionRepository";
import { DrizzlePosOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePosOrderRepository";
import { DrizzleBomRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleBomRepository";
import { DrizzleManufacturingOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleManufacturingOrderRepository";
import { DrizzleEmployeeRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleEmployeeRepository";
import { DrizzleExpenseClaimRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleExpenseClaimRepository";
import { DrizzleAttendanceRepository, DrizzleLeaveRequestRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleTimeoffRepository";
import { DrizzleServiceTicketRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleServiceTicketRepository";
import { DrizzlePromotionRepository, DrizzleLoyaltyRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleMarketingRepository";
import { DrizzlePayrollRunRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePayrollRunRepository";
import { DrizzleOnlineOrderRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleOnlineOrderRepository";
import { DrizzleProjectRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProjectRepository";
import { DrizzleProjectTaskRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleProjectTaskRepository";
import { DrizzleTimesheetRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleTimesheetRepository";
import { DrizzleStoreReviewRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStoreReviewRepository";
import { BcryptPasswordHasher } from "@/src/infrastructure/services/BcryptPasswordHasher";

import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { ISessionRepository } from "@/src/application/repositories/ISessionRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";
import type { IPartnerRepository } from "@/src/application/repositories/IPartnerRepository";
import type { IProductRepository } from "@/src/application/repositories/IProductRepository";
import type { IStockLocationRepository } from "@/src/application/repositories/IStockLocationRepository";
import type { IStockMoveRepository } from "@/src/application/repositories/IStockMoveRepository";
import type { IStockCountRepository } from "@/src/application/repositories/IStockCountRepository";
import type { IProductLotRepository } from "@/src/application/repositories/IProductLotRepository";
import type { ISalesOrderRepository } from "@/src/application/repositories/ISalesOrderRepository";
import type { IInvoiceRepository } from "@/src/application/repositories/IInvoiceRepository";
import type { ISalesReturnRepository } from "@/src/application/repositories/ISalesReturnRepository";
import type { IInstallmentPlanRepository } from "@/src/application/repositories/IInstallmentPlanRepository";
import type { IPaymentRepository } from "@/src/application/repositories/IPaymentRepository";
import type { IPurchaseOrderRepository } from "@/src/application/repositories/IPurchaseOrderRepository";
import type { IVendorBillRepository } from "@/src/application/repositories/IVendorBillRepository";
import type { IPurchaseReturnRepository } from "@/src/application/repositories/IPurchaseReturnRepository";
import type { IAccountRepository } from "@/src/application/repositories/IAccountRepository";
import type { IJournalRepository } from "@/src/application/repositories/IJournalRepository";
import type { IJournalEntryRepository } from "@/src/application/repositories/IJournalEntryRepository";
import type { IVatFilingRepository } from "@/src/application/repositories/IVatFilingRepository";
import type { IDunningLogRepository } from "@/src/application/repositories/IDunningLogRepository";
import type { IBankStatementRepository, IPeriodCloseRepository } from "@/src/application/repositories/IBankReconciliationRepository";
import type { ICrmStageRepository } from "@/src/application/repositories/ICrmStageRepository";
import type { IOpportunityRepository } from "@/src/application/repositories/IOpportunityRepository";
import type { IReportingRepository } from "@/src/application/repositories/IReportingRepository";
import type { IReorderRuleRepository } from "@/src/application/repositories/IReorderRuleRepository";
import type { IPosSessionRepository } from "@/src/application/repositories/IPosSessionRepository";
import type { IPosOrderRepository } from "@/src/application/repositories/IPosOrderRepository";
import type { IBomRepository } from "@/src/application/repositories/IBomRepository";
import type { IManufacturingOrderRepository } from "@/src/application/repositories/IManufacturingOrderRepository";
import type { IEmployeeRepository } from "@/src/application/repositories/IEmployeeRepository";
import type { IExpenseClaimRepository } from "@/src/application/repositories/IExpenseClaimRepository";
import type { IAttendanceRepository, ILeaveRequestRepository } from "@/src/application/repositories/ITimeoffRepository";
import type { IServiceTicketRepository } from "@/src/application/repositories/IServiceTicketRepository";
import type { IPromotionRepository, ILoyaltyRepository } from "@/src/application/repositories/IMarketingRepository";
import type { IPayrollRunRepository } from "@/src/application/repositories/IPayrollRunRepository";
import type { IOnlineOrderRepository } from "@/src/application/repositories/IOnlineOrderRepository";
import type { IProjectRepository } from "@/src/application/repositories/IProjectRepository";
import type { IProjectTaskRepository } from "@/src/application/repositories/IProjectTaskRepository";
import type { ITimesheetRepository } from "@/src/application/repositories/ITimesheetRepository";
import type { IStoreReviewRepository } from "@/src/application/repositories/IStoreReviewRepository";
import type { IPasswordHasher } from "@/src/application/services/IPasswordHasher";

/**
 * Composition root ฝั่ง server: singleton ของ repo + service ที่ wire impl จริงไว้.
 * สลับ implementation — แก้ "ที่นี่ที่เดียว" ไม่ต้องแตะ use case.
 */
class Container {
  readonly userRepository: IUserRepository = new DrizzleUserRepository();
  readonly shopRepository: IShopRepository = new DrizzleShopRepository();
  readonly sessionRepository: ISessionRepository = new DrizzleSessionRepository();
  readonly sequenceRepository: ISequenceRepository = new DrizzleSequenceRepository();
  readonly partnerRepository: IPartnerRepository = new DrizzlePartnerRepository();
  readonly productRepository: IProductRepository = new DrizzleProductRepository();
  readonly stockLocationRepository: IStockLocationRepository =
    new DrizzleStockLocationRepository();
  readonly stockMoveRepository: IStockMoveRepository = new DrizzleStockMoveRepository();
  readonly stockCountRepository: IStockCountRepository = new DrizzleStockCountRepository();
  readonly productLotRepository: IProductLotRepository = new DrizzleProductLotRepository();
  readonly salesOrderRepository: ISalesOrderRepository = new DrizzleSalesOrderRepository();
  readonly invoiceRepository: IInvoiceRepository = new DrizzleInvoiceRepository();
  readonly salesReturnRepository: ISalesReturnRepository = new DrizzleSalesReturnRepository();
  readonly installmentPlanRepository: IInstallmentPlanRepository = new DrizzleInstallmentPlanRepository();
  readonly paymentRepository: IPaymentRepository = new DrizzlePaymentRepository();
  readonly purchaseOrderRepository: IPurchaseOrderRepository =
    new DrizzlePurchaseOrderRepository();
  readonly vendorBillRepository: IVendorBillRepository = new DrizzleVendorBillRepository();
  readonly purchaseReturnRepository: IPurchaseReturnRepository = new DrizzlePurchaseReturnRepository();
  readonly accountRepository: IAccountRepository = new DrizzleAccountRepository();
  readonly journalRepository: IJournalRepository = new DrizzleJournalRepository();
  readonly journalEntryRepository: IJournalEntryRepository =
    new DrizzleJournalEntryRepository();
  readonly vatFilingRepository: IVatFilingRepository = new DrizzleVatFilingRepository();
  readonly dunningLogRepository: IDunningLogRepository = new DrizzleDunningLogRepository();
  readonly bankStatementRepository: IBankStatementRepository = new DrizzleBankStatementRepository();
  readonly periodCloseRepository: IPeriodCloseRepository = new DrizzlePeriodCloseRepository();
  readonly crmStageRepository: ICrmStageRepository = new DrizzleCrmStageRepository();
  readonly opportunityRepository: IOpportunityRepository =
    new DrizzleOpportunityRepository();
  readonly reportingRepository: IReportingRepository = new DrizzleReportingRepository();
  readonly reorderRuleRepository: IReorderRuleRepository = new DrizzleReorderRuleRepository();
  readonly posSessionRepository: IPosSessionRepository = new DrizzlePosSessionRepository();
  readonly posOrderRepository: IPosOrderRepository = new DrizzlePosOrderRepository();
  readonly bomRepository: IBomRepository = new DrizzleBomRepository();
  readonly manufacturingOrderRepository: IManufacturingOrderRepository =
    new DrizzleManufacturingOrderRepository();
  readonly employeeRepository: IEmployeeRepository = new DrizzleEmployeeRepository();
  readonly expenseClaimRepository: IExpenseClaimRepository = new DrizzleExpenseClaimRepository();
  readonly attendanceRepository: IAttendanceRepository = new DrizzleAttendanceRepository();
  readonly leaveRequestRepository: ILeaveRequestRepository = new DrizzleLeaveRequestRepository();
  readonly serviceTicketRepository: IServiceTicketRepository = new DrizzleServiceTicketRepository();
  readonly promotionRepository: IPromotionRepository = new DrizzlePromotionRepository();
  readonly loyaltyRepository: ILoyaltyRepository = new DrizzleLoyaltyRepository();
  readonly payrollRunRepository: IPayrollRunRepository = new DrizzlePayrollRunRepository();
  readonly onlineOrderRepository: IOnlineOrderRepository = new DrizzleOnlineOrderRepository();
  readonly projectRepository: IProjectRepository = new DrizzleProjectRepository();
  readonly projectTaskRepository: IProjectTaskRepository = new DrizzleProjectTaskRepository();
  readonly timesheetRepository: ITimesheetRepository = new DrizzleTimesheetRepository();
  readonly storeReviewRepository: IStoreReviewRepository = new DrizzleStoreReviewRepository();
  readonly passwordHasher: IPasswordHasher = new BcryptPasswordHasher();
}

// cache บน globalThis เพื่อกัน leak ตอน HMR ใน dev
const g = globalThis as unknown as { __container?: Container };
export const container = g.__container ?? new Container();
if (process.env.NODE_ENV !== "production") g.__container = container;
