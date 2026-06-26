import Link from "next/link";
import { ListChecks, ExternalLink, ArrowLeft } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import {
  JOURNEYS,
  journeyCoverage,
  overallCoverage,
  STEP_STATUS_META,
  type StepStatus,
} from "@/src/domain/services/journeys";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

const STATUSES: StepStatus[] = ["done", "partial", "missing"];

export default async function JourneyCoveragePage() {
  await requireRole("shop_owner");
  const overall = overallCoverage(JOURNEYS);

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
        <h1 className="text-2xl font-bold">Journey Coverage — แต่ละขั้นอยู่ URL ไหน + สถานะ</h1>
      </div>
      <p className="text-muted">
        ไล่เทสทีละ journey ว่ามีในโปรเจคแล้วหรือยัง อยู่ URL ไหน — คลิก URL จริงเพื่อเปิดหน้าในแท็บใหม่
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="จำนวน journey" value={`${overall.journeys}`} />
        <StatCard label="ขั้นตอนทั้งหมด" value={`${overall.totalSteps}`} />
        <StatCard label="ความครอบคลุมรวม" value={`${overall.donePercent}%`} />
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        {STATUSES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <Badge variant={STEP_STATUS_META[s].variant}>{STEP_STATUS_META[s].label}</Badge>
          </span>
        ))}
      </div>

      <div className="space-y-5">
        {JOURNEYS.map((j) => {
          const cov = journeyCoverage(j.steps);
          return (
            <Card key={j.id}>
              <CardBody className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{j.title}</h2>
                    <p className="text-sm text-muted">{j.description}</p>
                  </div>
                  <Badge variant="success">ทำได้ {cov.donePercent}%</Badge>
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
                            <a
                              href={s.route}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-xs text-brand-600 hover:underline"
                            >
                              {s.route}
                              <ExternalLink className="size-3 shrink-0" />
                            </a>
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
        })}
      </div>

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
