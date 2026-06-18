import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { LocationForm } from "@/src/presentation/components/inventory/LocationForm";

export default async function LocationsPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  // ให้แน่ใจว่ามีคลังหลักก่อนเสมอ แล้วดึงรายการ
  await container.stockLocationRepository.ensureDefault(shopId);
  const locations = await container.stockLocationRepository.list(shopId);

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "คลังสินค้า", href: "/shop/inventory" },
          { label: "จัดการคลัง" },
        ]}
      />
      <h1 className="text-2xl font-bold">คลังสินค้า</h1>

      <Card>
        <CardBody>
          <LocationForm />
        </CardBody>
      </Card>

      <Card>
        <Table>
          <THead>
            <Tr>
              <Th>ชื่อคลัง</Th>
              <Th>ประเภท</Th>
            </Tr>
          </THead>
          <TBody>
            {locations.map((l) => (
              <Tr key={l.id}>
                <Td className="font-medium">{l.name}</Td>
                <Td>{l.isDefault ? <Badge variant="brand">คลังหลัก</Badge> : <Badge variant="neutral">คลังย่อย</Badge>}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </Container>
  );
}
