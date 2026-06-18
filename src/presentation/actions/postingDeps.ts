import { container } from "@/src/infrastructure/di/container";
import type { PostDeps } from "@/src/application/use-cases/accounting/postJournalEntry";

/** รวม repo บัญชีจาก container เป็น PostDeps สำหรับ use case ลงบัญชีอัตโนมัติ */
export function postDeps(): PostDeps {
  return {
    accounts: container.accountRepository,
    journals: container.journalRepository,
    entries: container.journalEntryRepository,
    sequences: container.sequenceRepository,
  };
}
