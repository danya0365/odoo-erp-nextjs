import Link from "next/link";
import {
  Route,
  FileText,
  ShoppingCart,
  Globe,
  Store,
  Clock,
  ChevronRight,
  ChevronDown,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { JOURNEYS, journeyCoverage, STEP_STATUS_META } from "@/src/domain/services/journeys";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";

const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  ShoppingCart,
  Globe,
  Store,
};

export default async function JourneyPage() {
  await requireRole("shop_owner");

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "เส้นทางการใช้งาน" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Route className="size-7 text-brand-600" />
          <h1 className="text-2xl font-bold">User Journey — เส้นทางการใช้งาน</h1>
        </div>
        <Link
          href="/shop/journey/coverage"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-brand-300"
        >
          <ListChecks className="size-4" />
          ดู Coverage (URL + สถานะ)
        </Link>
      </div>
      <p className="text-muted">
        เดินดู flow การใช้งานจริงครบวงจรทีละขั้น — กดที่แต่ละขั้นเพื่อเปิดหน้าจริง เหมาะกับการ demo
      </p>

      <div className="space-y-3">
        {JOURNEYS.map((j) => {
          const Icon = ICON_MAP[j.icon] ?? Route;
          const cov = journeyCoverage(j.steps);
          return (
            <Card key={j.id}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start gap-4 p-5">
                  <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600">
                    <Icon className="size-6" />
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{j.title}</h3>
                      <Badge variant="success">ทำได้ {cov.donePercent}%</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{j.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {j.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Route className="size-3.5" />
                        {j.steps.length} ขั้นตอน
                      </span>
                      <span className="flex items-center gap-1 font-medium text-brand-600">
                        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                        ดูรายละเอียด
                      </span>
                    </div>
                  </div>
                </summary>

                <div className="border-t border-border px-5 py-4">
                  <ol className="space-y-2">
                    {j.steps.map((s, idx) => {
                      const meta = STEP_STATUS_META[s.status];
                      return (
                        <li key={`${j.id}-${idx}`} className="flex items-start gap-3">
                          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <Link
                            href={s.route}
                            className="group/step flex flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-brand-300"
                          >
                            <span className="font-medium">{s.title}</span>
                            <span className="hidden text-muted sm:inline">— {s.description}</span>
                            <Badge variant={meta.variant} className="ml-auto">
                              {meta.label}
                            </Badge>
                            <ChevronRight className="size-4 text-muted group-hover/step:text-brand-600" />
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </details>
            </Card>
          );
        })}
      </div>
    </Container>
  );
}
