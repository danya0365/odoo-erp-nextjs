import { requireRole } from "@/src/infrastructure/auth/session";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { PayrollRunForm } from "@/src/presentation/components/hr/PayrollRunForm";

export default async function NewPayrollRunPage() {
  await requireRole("shop_owner");
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <Container className="max-w-2xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บุคลากร", href: "/shop/hr" },
          { label: "เงินเดือน", href: "/shop/hr/payroll" },
          { label: "สร้างงวด" },
        ]}
      />
      <h1 className="text-2xl font-bold">สร้างงวดเงินเดือน</h1>
      <Card>
        <CardBody>
          <PayrollRunForm defaultPeriod={defaultPeriod} />
        </CardBody>
      </Card>
    </Container>
  );
}
