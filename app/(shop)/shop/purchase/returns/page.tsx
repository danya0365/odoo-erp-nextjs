import Link from "next/link";
import { Plus, PackageX } from "lucide-react";

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

export default async function PurchaseReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const result = await container.purchaseReturnRepository.list(shopId, { page, pageSize: DEFAULT_PAGE_SIZE, status: "" });
  const vendors = await Promise.all(
    result.items.map((r) => container.partnerRepository.findById(shopId, r.vendorId)),
  );
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การจัดซื้อ", href: "/shop/purchase" },
          { label: "คืนของผู้ขาย/ใบลดหนี้" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">คืนของผู้ขาย / ใบลดหนี้ผู้ขาย</h1>
        <Link href="/shop/purchase/returns/new">
          <Button><Plus className="size-4" />สร้างใบคืนของผู้ขาย</Button>
        </Link>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={PackageX}
          title="ยังไม่มีใบคืนของผู้ขาย"
          description="สร้างจากใบตั้งหนี้ผู้ขายเมื่อมีของชำรุด/ส่งผิด"
          action={
            <Link href="/shop/purchase/returns/new"><Button size="sm"><Plus className="size-4" />สร้างใบคืนของผู้ขาย</Button></Link>
          }
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>เลขที่</Th>
                <Th>ผู้ขาย</Th>
                <Th>วันที่</Th>
                <Th>ยอดคืน</Th>
                <Th>สถานะ</Th>
              </Tr>
            </THead>
            <TBody>
              {result.items.map((r, i) => (
                <Tr key={r.id}>
                  <Td>
                    <Link href={`/shop/purchase/returns/${r.id}`} className="font-medium text-brand-600 hover:underline">
                      {r.docNumber}
                    </Link>
                  </Td>
                  <Td>{vendors[i]?.name ?? "—"}</Td>
                  <Td>{new Date(r.createdAt).toLocaleDateString("th-TH")}</Td>
                  <Td>฿{formatScaled(r.totalAmount, 100)}</Td>
                  <Td><DocumentStatusBadge status={r.status} /></Td>
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
