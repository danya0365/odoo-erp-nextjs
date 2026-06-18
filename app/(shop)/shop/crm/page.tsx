import Link from "next/link";
import { Plus, Trophy, XCircle } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { pipelineTotals, weightedValue } from "@/src/domain/services/crm-status";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Button } from "@/src/presentation/components/ui/Button";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";

export default async function CrmBoardPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  const [stages, opps] = await Promise.all([
    container.crmStageRepository.ensureDefaults(shopId),
    container.opportunityRepository.listAll(shopId),
  ]);
  const totals = pipelineTotals(opps);
  const lost = opps.filter((o) => o.status === "lost");

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "CRM" }]} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">ไปป์ไลน์การขาย</h1>
        <Link href="/shop/crm/new">
          <Button>
            <Plus className="size-4" />
            สร้างโอกาสการขาย
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="โอกาสที่เปิดอยู่" value={String(totals.count)} />
        <StatCard label="รายได้คาดหวังรวม" value={`฿${formatScaled(totals.expected, 100)}`} />
        <StatCard label="ถ่วงน้ำหนัก" value={`฿${formatScaled(totals.weighted, 100)}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage) => {
          const cards = opps.filter((o) => o.stageId === stage.id && o.status !== "lost");
          return (
            <div key={stage.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 font-semibold">
                  {stage.isWon && <Trophy className="size-4 text-amber-500" />}
                  {stage.name}
                </h2>
                <Badge variant="neutral">{cards.length}</Badge>
              </div>
              {cards.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted">
                  ว่าง
                </p>
              ) : (
                cards.map((o) => (
                  <Link key={o.id} href={`/shop/crm/${o.id}`}>
                    <Card className="transition-colors hover:border-brand-300">
                      <CardBody className="space-y-1 p-4">
                        <p className="font-medium">{o.name}</p>
                        {o.contactName && <p className="text-sm text-muted">{o.contactName}</p>}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-semibold text-brand-600">
                            ฿{formatScaled(o.expectedRevenue, 100)}
                          </span>
                          <Badge variant={o.status === "won" ? "success" : "brand"}>
                            {o.status === "won" ? "ชนะ" : `${o.probability}%`}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted">
                          ถ่วงน้ำหนัก ฿{formatScaled(weightedValue(o.expectedRevenue, o.probability), 100)}
                        </p>
                      </CardBody>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          );
        })}
      </div>

      {lost.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-1.5 font-semibold text-muted">
            <XCircle className="size-4" />
            แพ้ ({lost.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lost.map((o) => (
              <Link key={o.id} href={`/shop/crm/${o.id}`}>
                <Card className="opacity-70 transition-opacity hover:opacity-100">
                  <CardBody className="flex items-center justify-between p-3">
                    <span className="text-sm">{o.name}</span>
                    <span className="text-xs text-muted">{o.lostReason ?? "—"}</span>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
