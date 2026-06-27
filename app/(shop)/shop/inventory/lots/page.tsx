import { PackageCheck, AlertTriangle } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { isExpired, isExpiringSoon } from "@/src/domain/services/lot";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { ReceiveLotForm, FefoForm } from "@/src/presentation/components/inventory/LotForms";

export default async function LotsPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const asOf = new Date().toISOString();

  const [lots, productPage] = await Promise.all([
    container.productLotRepository.listAll(shopId),
    container.productRepository.list(shopId, { page: 1, pageSize: 500, status: "" }),
  ]);
  const productName = new Map(productPage.items.map((p) => [p.id, p.name]));
  const options = productPage.items.filter((p) => p.isActive && p.type === "stockable").map((p) => ({ id: p.id, name: p.name }));
  const alerts = lots.filter((l) => l.qty > 0 && (isExpired(l.expiryDate, asOf) || isExpiringSoon(l.expiryDate, asOf, 30)));

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "คลังสินค้า", href: "/shop/inventory" }, { label: "ล็อต/วันหมดอายุ" }]} />
      <div className="flex items-center gap-3">
        <PackageCheck className="size-7 text-brand-600" />
        <h1 className="text-2xl font-bold">ล็อต / วันหมดอายุ (FEFO)</h1>
      </div>

      {alerts.length > 0 && (
        <Card className="border-warning">
          <CardBody className="space-y-1">
            <p className="flex items-center gap-2 font-semibold text-warning"><AlertTriangle className="size-4" />ใกล้หมดอายุ/หมดอายุ ({alerts.length})</p>
            {alerts.map((l) => (
              <p key={l.id} className="text-sm">
                {productName.get(l.productId) ?? "—"} · {l.lotNumber || "ล็อต"} · หมดอายุ {l.expiryDate} · เหลือ {formatScaled(l.qty, 1000)}
                {isExpired(l.expiryDate, asOf) ? <Badge variant="error" className="ml-2">หมดอายุแล้ว</Badge> : <Badge variant="warning" className="ml-2">ใกล้หมดอายุ</Badge>}
              </p>
            ))}
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardBody className="space-y-3"><h2 className="font-semibold">รับเข้าระบุล็อต + วันหมดอายุ</h2>{options.length === 0 ? <EmptyState title="ยังไม่มีสินค้า" description="เพิ่มสินค้าก่อน" /> : <ReceiveLotForm products={options} />}</CardBody></Card>
        <Card><CardBody className="space-y-3"><h2 className="font-semibold">ขายตัดสต๊อกแบบ FEFO</h2>{options.length === 0 ? <EmptyState title="ยังไม่มีสินค้า" description="เพิ่มสินค้าก่อน" /> : <FefoForm products={options} />}</CardBody></Card>
      </div>

      {lots.length === 0 ? (
        <EmptyState icon={PackageCheck} title="ยังไม่มีล็อต" description="รับเข้าสินค้าพร้อมระบุล็อต/วันหมดอายุ" />
      ) : (
        <Card>
          <Table>
            <THead><Tr><Th>สินค้า</Th><Th>เลขล็อต</Th><Th>วันหมดอายุ</Th><Th>คงเหลือ</Th></Tr></THead>
            <TBody>
              {lots.map((l) => {
                const expired = isExpired(l.expiryDate, asOf);
                const soon = isExpiringSoon(l.expiryDate, asOf, 30);
                return (
                  <Tr key={l.id}>
                    <Td>{productName.get(l.productId) ?? "—"}</Td>
                    <Td className="font-mono">{l.lotNumber || "—"}</Td>
                    <Td className={expired ? "text-error" : soon ? "text-warning" : "text-muted"}>{l.expiryDate}</Td>
                    <Td>{formatScaled(l.qty, 1000)}</Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}
    </Container>
  );
}
