"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { parseScaled } from "@/src/domain/services/money";
import { monthRange } from "@/src/domain/services/tax";
import { CreateManualJournalEntryUseCase } from "@/src/application/use-cases/accounting/CreateManualJournalEntryUseCase";
import { GetVatReportUseCase } from "@/src/application/use-cases/accounting/GetVatReportUseCase";
import { FileVatReturnUseCase } from "@/src/application/use-cases/accounting/FileVatReturnUseCase";
import { RecordDunningUseCase } from "@/src/application/use-cases/accounting/RecordDunningUseCase";

export interface FormState {
  error?: string;
  success?: string;
}

const lineSchema = z.object({
  accountId: z.string().min(1),
  label: z.string().optional(),
  debit: z.string().regex(/^\d+(\.\d+)?$/).optional().or(z.literal("")),
  credit: z.string().regex(/^\d+(\.\d+)?$/).optional().or(z.literal("")),
});
const manualSchema = z.object({
  ref: z.string().optional(),
  lines: z.array(lineSchema).min(2, "ต้องมีอย่างน้อย 2 บรรทัด"),
});

export async function createManualEntryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  let linesRaw: unknown;
  try {
    linesRaw = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { error: "รายการบัญชีไม่ถูกต้อง" };
  }
  const parsed = manualSchema.safeParse({
    ref: formData.get("ref") || undefined,
    lines: linesRaw,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  let entryId: string;
  try {
    const lines = parsed.data.lines.map((l) => ({
      accountId: l.accountId,
      label: l.label ?? "",
      debit: l.debit ? parseScaled(l.debit, 100) : 0,
      credit: l.credit ? parseScaled(l.credit, 100) : 0,
    }));
    const entry = await new CreateManualJournalEntryUseCase(
      container.journalRepository,
      container.journalEntryRepository,
      container.sequenceRepository,
    ).execute({
      shopId,
      date: new Date().toISOString(),
      ref: parsed.data.ref ?? null,
      lines,
    });
    entryId = entry.id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/shop/accounting/entries");
  redirect(`/shop/accounting/entries/${entryId}`);
}

/** ยื่น ภพ.30 ของงวด: คำนวณยอดจากสมุดรายวันฝั่ง server (ไม่เชื่อ client) แล้วบันทึก */
export async function fileVatReturnAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const month = String(formData.get("month") ?? "");
  if (!/^\d{4}-\d{2}$/.test(month)) return;

  const { from, to, periodEnd } = monthRange(month);
  const summary = await new GetVatReportUseCase(container.journalEntryRepository).execute(shopId, { from, to });
  await new FileVatReturnUseCase(container.vatFilingRepository).execute(
    shopId,
    month,
    periodEnd,
    summary,
    new Date().toISOString(),
  );
  revalidatePath("/shop/accounting/vat");
}

/** ส่งใบทวงหนี้ลูกค้า (บันทึก dunning log) */
export async function recordDunningAction(formData: FormData): Promise<void> {
  const user = await requireRole("shop_owner");
  const customerId = String(formData.get("customerId") ?? "");
  const amount = Number(formData.get("amount") ?? "0") || 0;
  await new RecordDunningUseCase(container.dunningLogRepository).execute(
    user.shopId!,
    customerId,
    amount,
    null,
    new Date().toISOString(),
  );
  revalidatePath("/shop/accounting/receivables");
}
