import Link from "next/link";
import {
  Route,
  FileText,
  ShoppingCart,
  Globe,
  Store,
  Target,
  Factory,
  Warehouse,
  ArrowLeftRight,
  Users2,
  FolderKanban,
  Calculator,
  BarChart3,
  Undo2,
  CalendarClock,
  Tag,
  Receipt,
  FileSpreadsheet,
  Landmark,
  ClipboardCheck,
  PackageCheck,
  PackageX,
  CalendarDays,
  ReceiptText,
  Wrench,
  Clock,
  ChevronRight,
  ChevronDown,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import {
  supportedJourneys,
  realWorldJourneys,
  journeyCoverage,
  STEP_STATUS_META,
  type Journey,
} from "@/src/domain/services/journeys";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";

const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  ShoppingCart,
  Globe,
  Store,
  Target,
  Factory,
  Warehouse,
  ArrowLeftRight,
  Users2,
  FolderKanban,
  Calculator,
  BarChart3,
  Undo2,
  CalendarClock,
  Tag,
  Receipt,
  FileSpreadsheet,
  Landmark,
  ClipboardCheck,
  PackageCheck,
  PackageX,
  CalendarDays,
  ReceiptText,
  Wrench,
};

function StepRow({ idx, step }: { idx: number; step: Journey["steps"][number] }) {
  const meta = STEP_STATUS_META[step.status];
  const inner = (
    <>
      <span className="font-medium">{step.title}</span>
      <span className="hidden text-muted sm:inline">— {step.description}</span>
      <Badge variant={meta.variant} className="ml-auto">
        {meta.label}
      </Badge>
    </>
  );
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
        {idx + 1}
      </span>
      {step.route ? (
        <Link
          href={step.route}
          className="group/step flex flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-brand-300"
        >
          {inner}
          <ChevronRight className="size-4 text-muted group-hover/step:text-brand-600" />
        </Link>
      ) : (
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm">
          {inner}
        </div>
      )}
    </li>
  );
}

function JourneyCard({ j }: { j: Journey }) {
  const Icon = ICON_MAP[j.icon] ?? Route;
  const cov = journeyCoverage(j.steps);
  return (
    <Card>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start gap-4 p-5">
          <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600">
            <Icon className="size-6" />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{j.title}</h3>
              <Badge variant={cov.donePercent === 100 ? "success" : cov.donePercent === 0 ? "error" : "warning"}>
                ทำได้ {cov.donePercent}%
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted">{j.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
              {j.estimatedTime !== "—" && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {j.estimatedTime}
                </span>
              )}
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
            {j.steps.map((s, idx) => (
              <StepRow key={`${j.id}-${idx}`} idx={idx} step={s} />
            ))}
          </ol>
        </div>
      </details>
    </Card>
  );
}

export default async function JourneyPage() {
  await requireRole("shop_owner");
  const supported = supportedJourneys();
  const realWorld = realWorldJourneys();

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
          ดู Coverage + Gap backlog
        </Link>
      </div>
      <p className="text-muted">
        เดินดู flow การใช้งานจริง — กดที่แต่ละขั้นเพื่อเปิดหน้าจริง · ส่วน “สถานการณ์จริง” คือ flow ที่โลกธุรกิจต้องมี
        แต่ระบบเรายังรองรับไม่ครบ (ขั้นที่ยังไม่มี = ไอเดียฟีเจอร์ที่ต้องทำต่อ)
      </p>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="text-success">✅</span> รองรับแล้ว ({supported.length})
        </h2>
        {supported.map((j) => (
          <JourneyCard key={j.id} j={j} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span>🌍</span> สถานการณ์จริง — ยังไม่รองรับครบ ({realWorld.length})
        </h2>
        <p className="text-sm text-muted">flow จากประสบการณ์ใช้งานจริง — ขั้นที่ติด badge “ยังไม่มี” คือฟีเจอร์ที่ควรทำต่อ</p>
        {realWorld.map((j) => (
          <JourneyCard key={j.id} j={j} />
        ))}
      </section>
    </Container>
  );
}
