// map สถานะเอกสาร (sales/purchase/invoice) → Badge variant + ป้ายไทย (reuse ทุก module)
import { Badge } from "@/src/presentation/components/ui/Badge";
import type { BadgeVariant } from "@/src/domain/services/document-status";

interface StatusMeta {
  label: string;
  variant: BadgeVariant;
}

const STATUS: Record<string, StatusMeta> = {
  // ทั่วไป
  draft: { label: "ร่าง", variant: "neutral" },
  cancelled: { label: "ยกเลิก", variant: "error" },
  done: { label: "เสร็จสิ้น", variant: "success" },
  // sales
  confirmed: { label: "ยืนยันแล้ว", variant: "brand" },
  partially_delivered: { label: "ส่งบางส่วน", variant: "warning" },
  delivered: { label: "ส่งครบแล้ว", variant: "brand" },
  invoiced: { label: "วางบิลแล้ว", variant: "brand" },
  // purchase
  rfq: { label: "ขอราคา", variant: "neutral" },
  partially_received: { label: "รับบางส่วน", variant: "warning" },
  received: { label: "รับครบแล้ว", variant: "brand" },
  billed: { label: "ตั้งหนี้แล้ว", variant: "brand" },
  // invoice / bill
  posted: { label: "ลงบัญชีแล้ว", variant: "brand" },
  paid: { label: "ชำระแล้ว", variant: "success" },
  // sales return / credit note
  credited: { label: "ออกใบลดหนี้แล้ว", variant: "brand" },
  refunded: { label: "คืนเงินแล้ว", variant: "success" },
};

export function DocumentStatusBadge({ status }: { status: string }) {
  const meta = STATUS[status] ?? { label: status, variant: "neutral" as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
