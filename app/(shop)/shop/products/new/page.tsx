import { requireRole } from "@/src/infrastructure/auth/session";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { ProductForm } from "@/src/presentation/components/inventory/ProductForm";
import { createProductAction } from "@/src/presentation/actions/product-actions";

export default async function NewProductPage() {
  await requireRole("shop_owner");
  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "สินค้า", href: "/shop/products" },
          { label: "เพิ่มใหม่" },
        ]}
      />
      <h1 className="text-2xl font-bold">เพิ่มสินค้า</h1>
      <Card>
        <CardBody>
          <ProductForm action={createProductAction} submitLabel="บันทึก" />
        </CardBody>
      </Card>
    </Container>
  );
}
