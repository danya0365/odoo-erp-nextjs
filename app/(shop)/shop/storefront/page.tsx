import Link from "next/link";
import { Globe, ExternalLink } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

export default async function StorefrontOrdersPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const [shop, orders] = await Promise.all([
    container.shopRepository.findById(shopId),
    container.onlineOrderRepository.list(shopId),
  ]);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "หน้าร้านออนไลน์" }]} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">หน้าร้านออนไลน์</h1>
        {shop && (
          <Link href={`/store/${shop.slug}`} target="_blank">
            <Button variant="secondary">
              <ExternalLink className="size-4" />
              เปิดหน้าร้าน
            </Button>
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="ยังไม่มีออร์เดอร์ออนไลน์"
          description="แชร์ลิงก์หน้าร้านให้ลูกค้าสั่งซื้อ ออร์เดอร์จะเข้าระบบการขายอัตโนมัติ"
        />
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table>
              <THead>
                <Tr>
                  <Th>เลขที่</Th>
                  <Th>ลูกค้า</Th>
                  <Th>ยอดรวม</Th>
                  <Th>ใบขาย</Th>
                </Tr>
              </THead>
              <TBody>
                {orders.map((o) => (
                  <Tr key={o.id}>
                    <Td className="font-medium">{o.orderNumber}</Td>
                    <Td>
                      {o.customerName}
                      <span className="block text-xs text-muted">{o.email}</span>
                    </Td>
                    <Td>฿{formatScaled(o.totalAmount, 100)}</Td>
                    <Td>
                      <Link
                        href={`/shop/sales/${o.salesOrderId}`}
                        className="text-brand-600 hover:underline"
                      >
                        เปิดใบขาย
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </Container>
  );
}
