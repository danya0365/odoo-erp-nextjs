import Link from "next/link";
import { ListChecks, ExternalLink, ArrowLeft, Lightbulb } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import {
  JOURNEYS,
  supportedJourneys,
  realWorldJourneys,
  journeyCoverage,
  overallCoverage,
  gapBacklog,
  gapSummary,
  STEP_STATUS_META,
  type Journey,
  type StepStatus,
} from "@/src/domain/services/journeys";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

const STATUSES: StepStatus[] = ["done", "partial", "missing"];

function CoverageCard({ j }: { j: Journey }) {
  const cov = journeyCoverage(j.steps);
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">{j.title}</h3>
            <p className="text-sm text-muted">{j.description}</p>
          </div>
          <Badge variant={cov.donePercent === 100 ? "success" : cov.donePercent === 0 ? "error" : "warning"}>
            ทำได้ {cov.donePercent}%
          </Badge>
        </div>

        <Table>
          <THead>
            <Tr>
              <Th className="w-10">#</Th>
              <Th>ขั้นตอน</Th>
              <Th>URL จริง</Th>
              <Th>สถานะ</Th>
            </Tr>
          </THead>
          <TBody>
            {j.steps.map((s, idx) => {
              const meta = STEP_STATUS_META[s.status];
              return (
                <Tr key={`${j.id}-${idx}`} className="align-top">
                  <Td className="text-muted">{idx + 1}</Td>
                  <Td>
                    <span className="font-medium">{s.title}</span>
                    <span className="block text-xs text-muted">{s.description}</span>
                  </Td>
                  <Td>
                    {s.route ? (
                      <a
                        href={s.route}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-brand-600 hover:underline"
                      >
                        {s.route}
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted">— ยังไม่มีหน้า</span>
                    )}
                  </Td>
                  <Td>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    {s.note && <span className="mt-1 block text-xs text-muted">{s.note}</span>}
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      </CardBody>
    </Card>
  );
}

export default async function JourneyCoveragePage() {
  await requireRole("shop_owner");
  const overall = overallCoverage(JOURNEYS);
  const backlog = gapBacklog(JOURNEYS);
  const gaps = gapSummary(JOURNEYS);
  const supported = supportedJourneys();
  const realWorld = realWorldJourneys();

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "เส้นทางการใช้งาน", href: "/shop/journey" },
          { label: "Coverage" },
        ]}
      />
      <div className="flex items-center gap-3">
        <ListChecks className="size-7 text-brand-600" />
        <h1 className="text-2xl font-bold">Journey Coverage + Gap backlog</h1>
      </div>
      <p className="text-muted">
        แต่ละขั้นอยู่ URL ไหน + สถานะ · “Gap backlog” คือฟีเจอร์ที่โลกจริงต้องมีแต่ระบบยังขาด — ลงมือทำต่อได้ทันที
      </p>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="จำนวน journey" value={`${overall.journeys}`} />
        <StatCard label="ความครอบคลุมรวม" value={`${overall.donePercent}%`} />
        <StatCard label="ฟีเจอร์ที่ยังไม่มี" value={`${gaps.missing}`} icon={Lightbulb} />
        <StatCard label="ทำบางส่วน" value={`${gaps.partial}`} />
      </div>

      {/* Gap backlog */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Lightbulb className="size-5 text-warning" />
          Gap backlog — ฟีเจอร์ที่ต้องทำ ({backlog.length})
        </h2>
        <Card>
          <CardBody>
            <Table>
              <THead>
                <Tr>
                  <Th>ฟีเจอร์ที่ขาด</Th>
                  <Th>สถานะ</Th>
                  <Th>ใช้ใน journey</Th>
                </Tr>
              </THead>
              <TBody>
                {backlog.map((g) => {
                  const meta = STEP_STATUS_META[g.status];
                  return (
                    <Tr key={g.feature} className="align-top">
                      <Td>
                        <span className="font-medium">{g.feature}</span>
                        {g.note && <span className="block text-xs text-muted">{g.note}</span>}
                      </Td>
                      <Td>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </Td>
                      <Td className="text-xs text-muted">{g.inJourneys.join(" · ")}</Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      </section>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        {STATUSES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <Badge variant={STEP_STATUS_META[s].variant}>{STEP_STATUS_META[s].label}</Badge>
          </span>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">✅ รองรับแล้ว ({supported.length})</h2>
        {supported.map((j) => (
          <CoverageCard key={j.id} j={j} />
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">🌍 สถานการณ์จริง — ยังไม่รองรับครบ ({realWorld.length})</h2>
        {realWorld.map((j) => (
          <CoverageCard key={j.id} j={j} />
        ))}
      </section>

      <Link
        href="/shop/journey"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        กลับไปหน้า เส้นทางการใช้งาน
      </Link>
    </Container>
  );
}
