import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { ManualEntryForm } from "@/src/presentation/components/accounting/ManualEntryForm";

export default async function NewJournalEntryPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const accounts = await container.accountRepository.ensureDefaults(shopId);

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บัญชี", href: "/shop/accounting" },
          { label: "สมุดรายวัน", href: "/shop/accounting/entries" },
          { label: "ลงรายการด้วยมือ" },
        ]}
      />
      <h1 className="text-2xl font-bold">ลงรายการบัญชีด้วยมือ</h1>
      <Card>
        <CardBody>
          <ManualEntryForm
            accounts={accounts.map((a) => ({ id: a.id, code: a.code, name: a.name }))}
          />
        </CardBody>
      </Card>
    </Container>
  );
}
