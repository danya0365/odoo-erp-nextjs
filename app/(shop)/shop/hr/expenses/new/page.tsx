import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { ExpenseClaimForm } from "@/src/presentation/components/hr/ExpenseClaimForm";

export default async function NewExpensePage() {
  const user = await requireRole("shop_owner");
  const employees = await container.employeeRepository.listActive(user.shopId!);

  return (
    <Container className="max-w-2xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บุคลากร", href: "/shop/hr" },
          { label: "เบิกค่าใช้จ่าย", href: "/shop/hr/expenses" },
          { label: "ยื่นเบิกใหม่" },
        ]}
      />
      <h1 className="text-2xl font-bold">ยื่นเบิกค่าใช้จ่าย</h1>
      {employees.length === 0 ? (
        <EmptyState title="ยังไม่มีพนักงาน" description="เพิ่มพนักงานก่อนจึงจะยื่นเบิกได้" />
      ) : (
        <Card>
          <CardBody>
            <ExpenseClaimForm employees={employees.map((e) => ({ id: e.id, name: e.name }))} />
          </CardBody>
        </Card>
      )}
    </Container>
  );
}
