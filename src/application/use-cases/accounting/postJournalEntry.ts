import type { JournalEntry, JournalEntrySourceType, JournalType } from "@/src/domain/entities";
import { assertBalanced, type DraftLine } from "@/src/domain/services/accounting";
import { formatDocNumber } from "@/src/domain/services/sequence";
import type { IAccountRepository } from "@/src/application/repositories/IAccountRepository";
import type { IJournalRepository } from "@/src/application/repositories/IJournalRepository";
import type { IJournalEntryRepository } from "@/src/application/repositories/IJournalEntryRepository";
import type { ISequenceRepository } from "@/src/application/repositories/ISequenceRepository";

export interface PostDeps {
  accounts: IAccountRepository;
  journals: IJournalRepository;
  entries: IJournalEntryRepository;
  sequences: ISequenceRepository;
}

export interface PostParams {
  shopId: string;
  journalType: JournalType;
  sourceType: JournalEntrySourceType;
  sourceId: string;
  ref: string | null;
  date: string;
  partnerId: string | null;
  draft: DraftLine[];
}

/**
 * แกนกลางการลงบัญชี: idempotent (กันลงซ้ำต่อเอกสารต้นทาง), บังคับสมดุล,
 * resolve รหัสบัญชี→id แล้วบันทึกเป็น journal entry ที่ posted แล้ว
 */
export async function postJournalEntry(
  deps: PostDeps,
  params: PostParams,
): Promise<JournalEntry> {
  const existing = await deps.entries.findBySource(
    params.shopId,
    params.sourceType,
    params.sourceId,
  );
  if (existing) return existing; // ลงแล้ว — คืนของเดิม

  assertBalanced(params.draft);

  const [accounts, journals] = await Promise.all([
    deps.accounts.ensureDefaults(params.shopId),
    deps.journals.ensureDefaults(params.shopId),
  ]);
  const codeMap = new Map(accounts.map((a) => [a.code, a]));
  const journal = journals.find((j) => j.type === params.journalType);
  if (!journal) throw new Error("ไม่พบสมุดรายวัน");

  const lines = params.draft.map((d) => {
    const acc = codeMap.get(d.accountCode);
    if (!acc) throw new Error(`ไม่พบบัญชีรหัส ${d.accountCode}`);
    return {
      accountId: acc.id,
      partnerId: params.partnerId,
      label: d.label,
      debit: d.debit,
      credit: d.credit,
    };
  });

  const seq = await deps.sequences.next(params.shopId, "journal_entry");
  return deps.entries.createWithLines({
    shopId: params.shopId,
    docNumber: formatDocNumber("JE", seq, 5),
    journalId: journal.id,
    date: params.date,
    ref: params.ref,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    status: "posted",
    lines,
  });
}
