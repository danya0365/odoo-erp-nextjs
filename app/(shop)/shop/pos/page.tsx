import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Button } from "@/src/presentation/components/ui/Button";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { OpenSessionForm } from "@/src/presentation/components/pos/OpenSessionForm";
import { PosTerminal } from "@/src/presentation/components/pos/PosTerminal";
import { CloseSessionForm } from "@/src/presentation/components/pos/CloseSessionForm";

const baht = (v: number) => `฿${formatScaled(v, 100)}`;

export default async function PosPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const session = await container.posSessionRepository.findOpen(shopId);

  return (
    <Container className="max-w-4xl space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "POS" }]} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">ขายหน้าร้าน (POS)</h1>
        <Link href="/shop/pos/sessions">
          <Button variant="ghost" size="sm">ประวัติกะ</Button>
        </Link>
      </div>

      {!session ? (
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-lg font-semibold">เปิดกะใหม่</h2>
            <p className="text-sm text-muted">ใส่เงินสดตั้งต้นในลิ้นชักเพื่อเริ่มขาย</p>
            <OpenSessionForm />
          </CardBody>
        </Card>
      ) : (
        <PosOpenView shopId={shopId} sessionId={session.id} openingCash={session.openingCash} openedAt={session.openedAt} />
      )}
    </Container>
  );
}

async function PosOpenView({
  shopId,
  sessionId,
  openingCash,
  openedAt,
}: {
  shopId: string;
  sessionId: string;
  openingCash: number;
  openedAt: string;
}) {
  const [productPage, orders] = await Promise.all([
    container.productRepository.list(shopId, { page: 1, pageSize: 100, status: "" }),
    container.posOrderRepository.listBySession(shopId, sessionId),
  ]);
  const products = productPage.items
    .filter((p) => p.isActive)
    .map((p) => ({ id: p.id, name: p.name, salePrice: p.salePrice, taxRateBp: p.taxRateBp }));
  const salesTotal = orders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="เปิดกะเมื่อ" value={new Date(openedAt).toLocaleString("th-TH")} />
        <StatCard label="บิลในกะ" value={String(orders.length)} />
        <StatCard label="ยอดขายในกะ" value={baht(salesTotal)} />
      </div>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-lg font-semibold">รายการขาย</h2>
          <PosTerminal sessionId={sessionId} products={products} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-lg font-semibold">ปิดกะ</h2>
          <p className="text-sm text-muted">เงินตั้งต้น {baht(openingCash)} · ขายในกะ {baht(salesTotal)}</p>
          <CloseSessionForm sessionId={sessionId} />
        </CardBody>
      </Card>
    </>
  );
}
