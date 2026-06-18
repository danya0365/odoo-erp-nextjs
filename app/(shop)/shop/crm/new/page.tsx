import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { OpportunityForm } from "@/src/presentation/components/crm/OpportunityForm";

export default async function NewOpportunityPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const result = await container.partnerRepository.list(shopId, {
    page: 1,
    pageSize: 100,
    status: "",
  });
  const customers = result.items
    .filter((p) => p.type === "customer" || p.type === "both")
    .map((p) => ({ id: p.id, name: p.name }));

  return (
    <Container className="max-w-2xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "CRM", href: "/shop/crm" },
          { label: "สร้างโอกาสการขาย" },
        ]}
      />
      <h1 className="text-2xl font-bold">สร้างโอกาสการขาย</h1>
      <Card>
        <CardBody>
          <OpportunityForm customers={customers} />
        </CardBody>
      </Card>
    </Container>
  );
}
