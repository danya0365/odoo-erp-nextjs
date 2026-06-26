import Link from "next/link";
import { CheckCircle2, Clock, ListChecks, ArrowRight } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import {
  ROADMAP_ITEMS,
  ROADMAP_TIERS,
  roadmapSummary,
  plannedByTier,
  type RoadmapTier,
} from "@/src/domain/services/roadmap-status";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";

const TIER_META: Record<RoadmapTier, { title: string; hint: string }> = {
  P1: { title: "P1 — ต่อยอดจากของที่มีโดยตรง", hint: "คุ้มสุด ทำต่อได้ทันที" },
  P2: { title: "P2 — module ใหม่ ขยายขอบเขต", hint: "เพิ่มสายธุรกิจใหม่" },
  P3: { title: "P3 — เฉพาะทาง / หลังสุด", hint: "ทำเมื่อจำเป็น" },
};

export default async function RoadmapPage() {
  await requireRole("shop_owner");

  const done = ROADMAP_ITEMS.filter((i) => i.status === "done");
  const review = ROADMAP_ITEMS.filter((i) => i.status === "review");
  const s = roadmapSummary(ROADMAP_ITEMS);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "โรดแมป" }]} />
      <div className="flex items-center gap-3">
        <ListChecks className="size-7 text-brand-600" />
        <h1 className="text-2xl font-bold">Roadmap — สถานะฟีเจอร์</h1>
      </div>
      <p className="text-muted">ตรวจสอบว่าโมดูลไหนทำเสร็จแล้ว เหลืออะไรบ้าง (เทียบกับ Odoo)</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="เสร็จแล้ว" value={`${s.done} โมดูล`} icon={CheckCircle2} />
        <StatCard label="รอตัดสินใจ" value={`${s.review} รายการ`} icon={Clock} />
        <StatCard label="ยังไม่ทำ" value={`${s.planned} รายการ`} icon={ListChecks} />
        <StatCard label="ความคืบหน้า" value={`${s.donePercent}%`} />
      </div>

      {/* progress bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted-surface" aria-label={`ความคืบหน้า ${s.donePercent}%`}>
        <div className="h-full rounded-full bg-success" style={{ width: `${s.donePercent}%` }} />
      </div>

      {/* เสร็จแล้ว */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <CheckCircle2 className="size-5 text-success" />
          เสร็จแล้ว ({done.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {done.map((m) => (
            <Link key={m.key} href={m.href ?? "/shop"}>
              <Card className="h-full transition-colors hover:border-brand-300">
                <CardBody className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-1 font-semibold">
                      {m.label}
                      <ArrowRight className="size-4 text-muted" />
                    </h3>
                    <Badge variant="success">เสร็จแล้ว</Badge>
                  </div>
                  <p className="text-sm text-muted">{m.desc}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* รอตัดสินใจ */}
      {review.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Clock className="size-5 text-warning" />
            รอตัดสินใจ ({review.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {review.map((m) => (
              <Card key={m.key}>
                <CardBody className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{m.label}</h3>
                    <Badge variant="warning">รอตัดสินใจ</Badge>
                  </div>
                  <p className="text-sm text-muted">{m.desc}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ยังไม่ทำ — Odoo-parity */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <ListChecks className="size-5 text-muted" />
          ยังไม่ทำ — Odoo-parity ({s.planned})
        </h2>
        {ROADMAP_TIERS.map((tier) => {
          const items = plannedByTier(ROADMAP_ITEMS, tier);
          if (items.length === 0) return null;
          return (
            <div key={tier} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="brand">{tier}</Badge>
                <span className="font-medium">{TIER_META[tier].title}</span>
                <span className="text-sm text-muted">· {TIER_META[tier].hint}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => (
                  <Card key={m.key}>
                    <CardBody className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold">{m.label}</h3>
                        <Badge variant="neutral">ยังไม่ทำ</Badge>
                      </div>
                      <p className="text-sm text-muted">{m.desc}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </Container>
  );
}
