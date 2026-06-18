import { notFound } from "next/navigation";
import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { weightedValue } from "@/src/domain/services/crm-status";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Select } from "@/src/presentation/components/ui/Select";
import { Input } from "@/src/presentation/components/ui/Input";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import {
  moveStageAction,
  markLostAction,
  reopenOpportunityAction,
  convertToQuotationAction,
} from "@/src/presentation/actions/crm-actions";

const STATUS_META: Record<string, { label: string; variant: "brand" | "success" | "error" }> = {
  active: { label: "เปิดอยู่", variant: "brand" },
  won: { label: "ชนะ", variant: "success" },
  lost: { label: "แพ้", variant: "error" },
};

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const opp = await container.opportunityRepository.findById(shopId, id);
  if (!opp) notFound();

  const [stages, partner] = await Promise.all([
    container.crmStageRepository.list(shopId),
    opp.partnerId ? container.partnerRepository.findById(shopId, opp.partnerId) : Promise.resolve(null),
  ]);
  const meta = STATUS_META[opp.status];

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "CRM", href: "/shop/crm" },
          { label: opp.name },
        ]}
      />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{opp.name}</h1>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>

      <Card>
        <CardBody className="grid gap-2 sm:grid-cols-2">
          <Info label="ลูกค้า" value={partner?.name ?? "—"} />
          <Info label="ผู้ติดต่อ" value={opp.contactName ?? "—"} />
          <Info label="อีเมล" value={opp.email ?? "—"} />
          <Info label="โทรศัพท์" value={opp.phone ?? "—"} />
          <Info label="รายได้คาดหวัง" value={`฿${formatScaled(opp.expectedRevenue, 100)}`} />
          <Info label="ความน่าจะเป็น" value={`${opp.probability}%`} />
          <Info
            label="ถ่วงน้ำหนัก"
            value={`฿${formatScaled(weightedValue(opp.expectedRevenue, opp.probability), 100)}`}
          />
          {opp.lostReason && <Info label="เหตุผลที่แพ้" value={opp.lostReason} />}
        </CardBody>
      </Card>

      {opp.salesOrderId && (
        <Card>
          <CardBody className="flex items-center justify-between">
            <span className="text-sm text-muted">แปลงเป็นใบเสนอราคาแล้ว</span>
            <Link href={`/shop/sales/${opp.salesOrderId}`}>
              <Button variant="secondary" size="sm">ดูใบเสนอราคา</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {opp.status !== "lost" && (
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold">จัดการ</h2>

            <form action={moveStageAction} className="flex items-end gap-3">
              <input type="hidden" name="id" value={opp.id} />
              <div className="flex-1">
                <label className="mb-1 block text-sm text-muted">สเตจ</label>
                <Select name="stageId" aria-label="สเตจ" defaultValue={opp.stageId}>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit" variant="secondary">ย้ายสเตจ</Button>
            </form>

            <div className="flex flex-wrap gap-3">
              {!opp.salesOrderId && opp.partnerId && (
                <form action={convertToQuotationAction}>
                  <input type="hidden" name="id" value={opp.id} />
                  <Button type="submit">แปลงเป็นใบเสนอราคา</Button>
                </form>
              )}
              <form action={markLostAction} className="flex items-end gap-2">
                <input type="hidden" name="id" value={opp.id} />
                <Input name="reason" placeholder="เหตุผลที่แพ้" className="w-48" />
                <Button type="submit" variant="ghost">ทำเครื่องหมายแพ้</Button>
              </form>
            </div>
          </CardBody>
        </Card>
      )}

      {opp.status === "lost" && (
        <form action={reopenOpportunityAction}>
          <input type="hidden" name="id" value={opp.id} />
          <Button type="submit" variant="secondary">เปิดโอกาสนี้ใหม่</Button>
        </form>
      )}
    </Container>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
