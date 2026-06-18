import { notFound } from "next/navigation";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { PartnerForm } from "@/src/presentation/components/contacts/PartnerForm";
import {
  updatePartnerAction,
  archivePartnerAction,
} from "@/src/presentation/actions/partner-actions";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const { id } = await params;
  const partner = await container.partnerRepository.findById(user.shopId!, id);
  if (!partner) notFound();

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "ผู้ติดต่อ", href: "/shop/contacts" },
          { label: partner.name },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{partner.name}</h1>
        <form action={archivePartnerAction}>
          <input type="hidden" name="id" value={partner.id} />
          <input type="hidden" name="isActive" value={partner.isActive ? "false" : "true"} />
          <Button variant={partner.isActive ? "ghost" : "secondary"} size="sm" type="submit">
            {partner.isActive ? "เก็บถาวร" : "เปิดใช้งาน"}
          </Button>
        </form>
      </div>
      <Card>
        <CardBody>
          <PartnerForm
            action={updatePartnerAction}
            partner={partner}
            submitLabel="บันทึกการแก้ไข"
          />
        </CardBody>
      </Card>
    </Container>
  );
}
