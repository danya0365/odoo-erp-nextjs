import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Button } from "@/src/presentation/components/ui/Button";
import { QuotationForm } from "@/src/presentation/components/sales/QuotationForm";
import Link from "next/link";

export default async function NewSalePage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  // ลูกค้า + สินค้าที่ขายได้ (active) — filter ฝั่ง server
  const [partners, products] = await Promise.all([
    container.partnerRepository.listActiveByType(shopId, "customer"),
    container.productRepository.listActive(shopId),
  ]);
  const customers = partners.map((p) => ({ id: p.id, name: p.name }));
  const productOptions = products.map((p) => ({ id: p.id, name: p.name, salePrice: p.salePrice, taxRateBp: p.taxRateBp }));

  return (
    <Container className="max-w-4xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การขาย", href: "/shop/sales" },
          { label: "ใบเสนอราคาใหม่" },
        ]}
      />
      <h1 className="text-2xl font-bold">ใบเสนอราคาใหม่</h1>
      {customers.length === 0 || productOptions.length === 0 ? (
        <EmptyState
          title="ต้องมีลูกค้าและสินค้าก่อน"
          description="กรุณาเพิ่มลูกค้าและสินค้าอย่างน้อยอย่างละ 1 รายการ"
          action={
            <div className="flex gap-2">
              <Link href="/shop/contacts/new"><Button size="sm" variant="secondary">เพิ่มลูกค้า</Button></Link>
              <Link href="/shop/products/new"><Button size="sm" variant="secondary">เพิ่มสินค้า</Button></Link>
            </div>
          }
        />
      ) : (
        <Card>
          <CardBody>
            <QuotationForm customers={customers} products={productOptions} />
          </CardBody>
        </Card>
      )}
    </Container>
  );
}
