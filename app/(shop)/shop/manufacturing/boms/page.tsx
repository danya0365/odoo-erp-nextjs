import Link from "next/link";
import { Plus, ListTree } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

export default async function BomsPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const boms = await container.bomRepository.list(shopId);
  const products = await Promise.all(
    boms.map((b) => container.productRepository.findById(shopId, b.productId)),
  );

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การผลิต", href: "/shop/manufacturing" },
          { label: "สูตรการผลิต" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">สูตรการผลิต (BOM)</h1>
        <Link href="/shop/manufacturing/boms/new">
          <Button><Plus className="size-4" />สร้างสูตร</Button>
        </Link>
      </div>

      {boms.length === 0 ? (
        <EmptyState icon={ListTree} title="ยังไม่มีสูตร" description="สร้างสูตรแรกเพื่อกำหนดวัตถุดิบของสินค้าสำเร็จรูป" />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>ชื่อสูตร</Th>
                <Th>สินค้าสำเร็จรูป</Th>
              </Tr>
            </THead>
            <TBody>
              {boms.map((b, i) => (
                <Tr key={b.id}>
                  <Td className="font-medium">{b.name}</Td>
                  <Td>{products[i]?.name ?? "—"}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </Container>
  );
}
