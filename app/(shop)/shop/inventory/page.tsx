import Link from "next/link";
import { Warehouse, ArrowLeftRight, PackageSearch, ArrowRight } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { GetReplenishmentUseCase } from "@/src/application/use-cases/inventory/GetReplenishmentUseCase";
import { GetInventoryValuationUseCase } from "@/src/application/use-cases/reporting/GetInventoryValuationUseCase";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";

const LINKS = [
  { href: "/shop/inventory/locations", label: "คลังสินค้า", desc: "จัดการหลายคลัง", icon: Warehouse },
  { href: "/shop/inventory/transfer", label: "โอนย้ายสต๊อก", desc: "ย้ายระหว่างคลัง", icon: ArrowLeftRight },
  { href: "/shop/inventory/reorder", label: "จุดสั่งซื้อซ้ำ", desc: "ตั้ง min/max + รายการที่ต้องเติม", icon: PackageSearch },
];

export default async function InventoryHubPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  const [locations, replenishment, valuation] = await Promise.all([
    container.stockLocationRepository.list(shopId),
    new GetReplenishmentUseCase(
      container.reorderRuleRepository,
      container.stockMoveRepository,
      container.productRepository,
    ).execute(shopId),
    new GetInventoryValuationUseCase(container.reportingRepository).execute(shopId),
  ]);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "คลังสินค้า" }]} />
      <h1 className="text-2xl font-bold">คลังสินค้า</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="จำนวนคลัง" value={String(locations.length)} />
        <StatCard label="ต้องเติมสต๊อก" value={String(replenishment.toReorder)} />
        <StatCard label="มูลค่าสต๊อก" value={`฿${formatScaled(valuation.totalValue, 100)}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.href} href={m.href}>
              <Card className="transition-colors hover:border-brand-300">
                <CardBody className="flex items-start gap-4">
                  <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600">
                    <Icon className="size-6" />
                  </span>
                  <div className="flex-1">
                    <h3 className="flex items-center gap-1 font-semibold">
                      {m.label}
                      <ArrowRight className="size-4 text-muted" />
                    </h3>
                    <p className="mt-0.5 text-sm text-muted">{m.desc}</p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
