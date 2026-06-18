import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { MoForm } from "@/src/presentation/components/manufacturing/MoForm";

export default async function NewMoPage() {
  const user = await requireRole("shop_owner");
  const boms = await container.bomRepository.list(user.shopId!);

  return (
    <Container className="max-w-2xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การผลิต", href: "/shop/manufacturing" },
          { label: "สร้างใบสั่งผลิต" },
        ]}
      />
      <h1 className="text-2xl font-bold">สร้างใบสั่งผลิต</h1>
      <Card>
        <CardBody>
          {boms.length === 0 ? (
            <EmptyState
              title="ยังไม่มีสูตรการผลิต"
              description="สร้างสูตร (BOM) ก่อนเปิดใบสั่งผลิต"
              action={
                <Link href="/shop/manufacturing/boms/new">
                  <Button size="sm">สร้างสูตร</Button>
                </Link>
              }
            />
          ) : (
            <MoForm boms={boms.map((b) => ({ id: b.id, name: b.name }))} />
          )}
        </CardBody>
      </Card>
    </Container>
  );
}
