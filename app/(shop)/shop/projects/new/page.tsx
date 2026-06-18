import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { ProjectForm } from "@/src/presentation/components/projects/ProjectForm";

export default async function NewProjectPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const page = await container.partnerRepository.list(shopId, { page: 1, pageSize: 100, status: "customer" });
  const customers = page.items.map((p) => ({ id: p.id, name: p.name }));

  return (
    <Container className="max-w-2xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "โครงการ", href: "/shop/projects" },
          { label: "สร้างโครงการ" },
        ]}
      />
      <h1 className="text-2xl font-bold">สร้างโครงการ</h1>
      <Card>
        <CardBody>
          <ProjectForm customers={customers} />
        </CardBody>
      </Card>
    </Container>
  );
}
