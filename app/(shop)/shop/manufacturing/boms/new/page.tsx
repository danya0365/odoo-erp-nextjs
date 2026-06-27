import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { BomForm } from "@/src/presentation/components/manufacturing/BomForm";

export default async function NewBomPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const products = (await container.productRepository.listActive(shopId)).map((p) => ({ id: p.id, name: p.name }));

  return (
    <Container className="max-w-2xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การผลิต", href: "/shop/manufacturing" },
          { label: "สูตรการผลิต", href: "/shop/manufacturing/boms" },
          { label: "สร้างสูตร" },
        ]}
      />
      <h1 className="text-2xl font-bold">สร้างสูตรการผลิต</h1>
      <Card>
        <CardBody>
          <BomForm products={products} />
        </CardBody>
      </Card>
    </Container>
  );
}
