import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { EmployeeForm } from "@/src/presentation/components/hr/EmployeeForm";

export default async function EmployeesPage() {
  const user = await requireRole("shop_owner");
  const employees = await container.employeeRepository.list(user.shopId!);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บุคลากร", href: "/shop/hr" },
          { label: "พนักงาน" },
        ]}
      />
      <h1 className="text-2xl font-bold">พนักงาน</h1>

      <Card>
        <CardBody>
          <EmployeeForm />
        </CardBody>
      </Card>

      {employees.length === 0 ? (
        <EmptyState title="ยังไม่มีพนักงาน" description="เพิ่มพนักงานคนแรกด้านบน" />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>ชื่อ</Th>
                <Th>ตำแหน่ง</Th>
                <Th>เงินเดือน</Th>
                <Th>สถานะ</Th>
              </Tr>
            </THead>
            <TBody>
              {employees.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-medium">{e.name}</Td>
                  <Td>{e.position ?? "—"}</Td>
                  <Td>฿{formatScaled(e.baseSalary, 100)}</Td>
                  <Td>
                    <Badge variant={e.isActive ? "success" : "neutral"}>
                      {e.isActive ? "ทำงานอยู่" : "พ้นสภาพ"}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </Container>
  );
}
