import Link from "next/link";
import { TrendingUp, Boxes, ArrowRight } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { GetDashboardUseCase } from "@/src/application/use-cases/reporting/GetDashboardUseCase";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { BarChart } from "@/src/presentation/components/reporting/BarChart";

const baht = (v: number) => `฿${formatScaled(v, 100)}`;

export default async function ReportsDashboardPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const d = await new GetDashboardUseCase(
    container.reportingRepository,
    container.accountRepository,
    container.journalEntryRepository,
    container.opportunityRepository,
  ).execute(shopId, new Date().toISOString());

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "รายงาน" }]} />
      <h1 className="text-2xl font-bold">ภาพรวมกิจการ</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="กำไรสุทธิ" value={baht(d.netProfit)} />
        <StatCard label="เงินสด/ธนาคาร" value={baht(d.cash)} />
        <StatCard label="ยอดขายรวม" value={baht(d.sales.total)} />
        <StatCard label="ยอดซื้อรวม" value={baht(d.purchases.total)} />
        <StatCard label="ลูกหนี้คงค้าง" value={baht(d.accountsReceivable)} />
        <StatCard label="เจ้าหนี้คงค้าง" value={baht(d.accountsPayable)} />
        <StatCard label="มูลค่าสต๊อก" value={baht(d.inventoryValue)} />
        <StatCard label="ไปป์ไลน์ (ถ่วงน้ำหนัก)" value={baht(d.pipeline.weighted)} />
      </div>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-semibold">ยอดขาย 6 เดือนล่าสุด</h2>
          <BarChart data={d.salesByMonth.map((m) => ({ label: m.month, value: m.total }))} />
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/shop/reports/sales">
          <Card className="transition-colors hover:border-brand-300">
            <CardBody className="flex items-start gap-4">
              <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600">
                <TrendingUp className="size-6" />
              </span>
              <div className="flex-1">
                <h3 className="flex items-center gap-1 font-semibold">
                  รายงานการขาย
                  <ArrowRight className="size-4 text-muted" />
                </h3>
                <p className="mt-0.5 text-sm text-muted">ยอดต่อเดือน + สินค้าขายดี</p>
              </div>
            </CardBody>
          </Card>
        </Link>
        <Link href="/shop/reports/inventory">
          <Card className="transition-colors hover:border-brand-300">
            <CardBody className="flex items-start gap-4">
              <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600">
                <Boxes className="size-6" />
              </span>
              <div className="flex-1">
                <h3 className="flex items-center gap-1 font-semibold">
                  มูลค่าสินค้าคงคลัง
                  <ArrowRight className="size-4 text-muted" />
                </h3>
                <p className="mt-0.5 text-sm text-muted">ตีมูลค่า + สินค้าหมดสต๊อก</p>
              </div>
            </CardBody>
          </Card>
        </Link>
      </div>
    </Container>
  );
}
