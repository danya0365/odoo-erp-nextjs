import Link from "next/link";
import { Plus, Package } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { DEFAULT_PAGE_SIZE } from "@/src/application/repositories/pagination";
import { formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { PagerNav } from "@/src/presentation/components/shared/PagerNav";

const TYPE_LABEL: Record<string, string> = {
  stockable: "นับสต๊อก",
  consumable: "สิ้นเปลือง",
  service: "บริการ",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const search = sp.search?.trim() ?? "";

  const [result, onHandRows] = await Promise.all([
    container.productRepository.list(user.shopId!, {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      search,
    }),
    container.stockMoveRepository.onHandList(user.shopId!),
  ]);
  const onHand = new Map(onHandRows.map((r) => [r.productId, r.onHand]));
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "สินค้า" }]} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">สินค้า</h1>
        <Link href="/shop/products/new">
          <Button>
            <Plus className="size-4" />
            เพิ่มสินค้า
          </Button>
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <Input name="search" defaultValue={search} placeholder="ค้นหาชื่อ/SKU…" className="max-w-xs" />
        <Button type="submit" variant="secondary">ค้นหา</Button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="ยังไม่มีสินค้า"
          description="เพิ่มสินค้ารายการแรกเพื่อเริ่มจัดการสต๊อก"
          action={
            <Link href="/shop/products/new">
              <Button size="sm"><Plus className="size-4" />เพิ่มสินค้า</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>SKU</Th>
                <Th>ชื่อ</Th>
                <Th>ประเภท</Th>
                <Th>ราคาขาย</Th>
                <Th>คงเหลือ</Th>
                <Th>สถานะ</Th>
              </Tr>
            </THead>
            <TBody>
              {result.items.map((p) => (
                <Tr key={p.id}>
                  <Td>{p.sku}</Td>
                  <Td>
                    <Link
                      href={`/shop/products/${p.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </Td>
                  <Td>{TYPE_LABEL[p.type] ?? p.type}</Td>
                  <Td>฿{formatScaled(p.salePrice, 100)}</Td>
                  <Td>
                    {p.type === "stockable"
                      ? `${formatScaled(onHand.get(p.id) ?? 0, QTY_SCALE)} ${p.uom}`
                      : "—"}
                  </Td>
                  <Td>
                    {p.isActive ? (
                      <Badge variant="success">ใช้งาน</Badge>
                    ) : (
                      <Badge>เก็บถาวร</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      <PagerNav page={page} totalPages={totalPages} />
    </Container>
  );
}
