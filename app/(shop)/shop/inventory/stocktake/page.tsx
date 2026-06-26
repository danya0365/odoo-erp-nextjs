import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { DEFAULT_PAGE_SIZE } from "@/src/application/repositories/pagination";
import { createStockCountAction } from "@/src/presentation/actions/stocktake-actions";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { PagerNav } from "@/src/presentation/components/shared/PagerNav";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";

export default async function StocktakePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const result = await container.stockCountRepository.list(shopId, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status: "",
  });
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "คลังสินค้า", href: "/shop/inventory" },
          { label: "ตรวจนับสต๊อก" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">ตรวจนับสต๊อก</h1>
        <form action={createStockCountAction}>
          <Button type="submit">
            <Plus className="size-4" />
            เปิดรอบนับใหม่
          </Button>
        </form>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="ยังไม่มีรอบตรวจนับ"
          description="เปิดรอบนับเพื่อ snapshot ยอดระบบแล้วกรอกยอดนับจริง"
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>เลขที่</Th>
                <Th>วันที่</Th>
                <Th>สถานะ</Th>
              </Tr>
            </THead>
            <TBody>
              {result.items.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link
                      href={`/shop/inventory/stocktake/${c.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {c.docNumber}
                    </Link>
                  </Td>
                  <Td>{new Date(c.createdAt).toLocaleDateString("th-TH")}</Td>
                  <Td>
                    <DocumentStatusBadge status={c.status} />
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
