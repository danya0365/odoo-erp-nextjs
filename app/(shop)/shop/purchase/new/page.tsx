import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Button } from "@/src/presentation/components/ui/Button";
import { RfqForm } from "@/src/presentation/components/purchase/RfqForm";

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { product: defaultProductId } = await searchParams;

  const [partners, products] = await Promise.all([
    container.partnerRepository.listActiveByType(shopId, "vendor"),
    container.productRepository.listActive(shopId),
  ]);
  const vendors = partners.map((p) => ({ id: p.id, name: p.name }));
  const productOptions = products.map((p) => ({ id: p.id, name: p.name, costPrice: p.costPrice, taxRateBp: p.taxRateBp }));

  return (
    <Container className="max-w-4xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การจัดซื้อ", href: "/shop/purchase" },
          { label: "ใบขอราคาใหม่" },
        ]}
      />
      <h1 className="text-2xl font-bold">ใบขอราคาใหม่</h1>
      {vendors.length === 0 || productOptions.length === 0 ? (
        <EmptyState
          title="ต้องมีผู้ขายและสินค้าก่อน"
          description="กรุณาเพิ่มผู้ขาย (ประเภทผู้ขาย/ทั้งคู่) และสินค้าอย่างน้อยอย่างละ 1 รายการ"
          action={
            <div className="flex gap-2">
              <Link href="/shop/contacts/new"><Button size="sm" variant="secondary">เพิ่มผู้ขาย</Button></Link>
              <Link href="/shop/products/new"><Button size="sm" variant="secondary">เพิ่มสินค้า</Button></Link>
            </div>
          }
        />
      ) : (
        <Card>
          <CardBody>
            <RfqForm vendors={vendors} products={productOptions} defaultProductId={defaultProductId} />
          </CardBody>
        </Card>
      )}
    </Container>
  );
}
