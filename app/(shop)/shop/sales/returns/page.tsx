import Link from "next/link";
import { Plus, Undo2 } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { DEFAULT_PAGE_SIZE } from "@/src/application/repositories/pagination";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { PagerNav } from "@/src/presentation/components/shared/PagerNav";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";

export default async function SalesReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const result = await container.salesReturnRepository.list(shopId, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status: "",
  });
  const customers = await Promise.all(
    result.items.map((r) => container.partnerRepository.findById(shopId, r.customerId)),
  );
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การขาย", href: "/shop/sales" },
          { label: "คืนสินค้า/ใบลดหนี้" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">คืนสินค้า / ใบลดหนี้</h1>
        <Link href="/shop/sales/returns/new">
          <Button>
            <Plus className="size-4" />
            สร้างใบคืนสินค้า
          </Button>
        </Link>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Undo2}
          title="ยังไม่มีใบคืนสินค้า"
          description="สร้างใบคืนสินค้าจากใบแจ้งหนี้เดิมของลูกค้า"
          action={
            <Link href="/shop/sales/returns/new">
              <Button size="sm"><Plus className="size-4" />สร้างใบคืนสินค้า</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>เลขที่</Th>
                <Th>ลูกค้า</Th>
                <Th>วันที่</Th>
                <Th>ยอดคืน</Th>
                <Th>สถานะ</Th>
              </Tr>
            </THead>
            <TBody>
              {result.items.map((r, i) => (
                <Tr key={r.id}>
                  <Td>
                    <Link
                      href={`/shop/sales/returns/${r.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {r.docNumber}
                    </Link>
                  </Td>
                  <Td>{customers[i]?.name ?? "—"}</Td>
                  <Td>{new Date(r.createdAt).toLocaleDateString("th-TH")}</Td>
                  <Td>฿{formatScaled(r.totalAmount, 100)}</Td>
                  <Td>
                    <DocumentStatusBadge status={r.status} />
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
