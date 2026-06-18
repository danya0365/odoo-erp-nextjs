import Link from "next/link";
import { Plus, Factory, ListTree } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { DEFAULT_PAGE_SIZE } from "@/src/application/repositories/pagination";
import { formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Select } from "@/src/presentation/components/ui/Select";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { PagerNav } from "@/src/presentation/components/shared/PagerNav";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";

export default async function ManufacturingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const status = sp.status ?? "";

  const result = await container.manufacturingOrderRepository.list(shopId, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status,
  });
  const products = await Promise.all(
    result.items.map((o) => container.productRepository.findById(shopId, o.productId)),
  );
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "การผลิต" }]} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">การผลิต</h1>
        <div className="flex gap-2">
          <Link href="/shop/manufacturing/boms">
            <Button variant="ghost"><ListTree className="size-4" />สูตรการผลิต</Button>
          </Link>
          <Link href="/shop/manufacturing/new">
            <Button><Plus className="size-4" />สร้างใบสั่งผลิต</Button>
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap gap-3">
        <div className="w-48">
          <Select name="status" defaultValue={status}>
            <option value="">ทุกสถานะ</option>
            <option value="draft">ร่าง</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="done">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">กรอง</Button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="ยังไม่มีใบสั่งผลิต"
          description="สร้างสูตรการผลิตก่อน แล้วเปิดใบสั่งผลิต"
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>เลขที่</Th>
                <Th>สินค้า</Th>
                <Th>จำนวน</Th>
                <Th>สถานะ</Th>
              </Tr>
            </THead>
            <TBody>
              {result.items.map((o, i) => (
                <Tr key={o.id}>
                  <Td>
                    <Link
                      href={`/shop/manufacturing/${o.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {o.docNumber ?? "(ร่าง)"}
                    </Link>
                  </Td>
                  <Td>{products[i]?.name ?? "—"}</Td>
                  <Td>{formatScaled(o.qty, QTY_SCALE)}</Td>
                  <Td><DocumentStatusBadge status={o.status} /></Td>
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
