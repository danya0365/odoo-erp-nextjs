import { requireRole } from "@/src/infrastructure/auth/session";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { PartnerForm } from "@/src/presentation/components/contacts/PartnerForm";
import { createPartnerAction } from "@/src/presentation/actions/partner-actions";

export default async function NewContactPage() {
  await requireRole("shop_owner");
  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "ผู้ติดต่อ", href: "/shop/contacts" },
          { label: "เพิ่มใหม่" },
        ]}
      />
      <h1 className="text-2xl font-bold">เพิ่มผู้ติดต่อ</h1>
      <Card>
        <CardBody>
          <PartnerForm action={createPartnerAction} submitLabel="บันทึก" />
        </CardBody>
      </Card>
    </Container>
  );
}
