import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { ServiceTicketForm } from "@/src/presentation/components/service/ServiceForms";

export default async function NewServiceTicketPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const customers = (await container.partnerRepository.listActiveByType(shopId, "customer")).map((p) => ({ id: p.id, name: p.name }));

  return (
    <Container className="max-w-2xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "งานบริการ/ซ่อม", href: "/shop/service" },
          { label: "เปิดใบงาน" },
        ]}
      />
      <h1 className="text-2xl font-bold">เปิดใบงานบริการ</h1>
      {customers.length === 0 ? (
        <EmptyState title="ยังไม่มีลูกค้า" description="เพิ่มผู้ติดต่อประเภทลูกค้าก่อน" />
      ) : (
        <Card><CardBody><ServiceTicketForm customers={customers} /></CardBody></Card>
      )}
    </Container>
  );
}
