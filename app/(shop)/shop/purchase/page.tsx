import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { DEFAULT_PAGE_SIZE } from "@/src/application/repositories/pagination";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Select } from "@/src/presentation/components/ui/Select";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { PagerNav } from "@/src/presentation/components/shared/PagerNav";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";

export default async function PurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const status = sp.status ?? "";

  const result = await container.purchaseOrderRepository.list(shopId, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status,
  });
  const vendors = await Promise.all(
    result.items.map((o) => container.partnerRepository.findById(shopId, o.vendorId)),
  );
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "การจัดซื้อ" }]} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">การจัดซื้อ</h1>
        <Link href="/shop/purchase/new">
          <Button>
            <Plus className="size-4" />
            สร้างใบขอราคา
          </Button>
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <div className="w-48">
          <Select name="status" defaultValue={status}>
            <option value="">ทุกสถานะ</option>
            <option value="rfq">ขอราคา</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="partially_received">รับบางส่วน</option>
            <option value="received">รับครบแล้ว</option>
            <option value="billed">ตั้งหนี้แล้ว</option>
            <option value="done">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">กรอง</Button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="ยังไม่มีใบสั่งซื้อ"
          description="เริ่มต้นด้วยการสร้างใบขอราคาแรก"
          action={
            <Link href="/shop/purchase/new">
              <Button size="sm"><Plus className="size-4" />สร้างใบขอราคา</Button>
            </Link>
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
                <Th>ยอดรวม</Th>
                <Th>สถานะ</Th>
              </Tr>
            </THead>
            <TBody>
              {result.items.map((o, i) => (
                <Tr key={o.id}>
                  <Td>
                    <Link
                      href={`/shop/purchase/${o.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {o.docNumber ?? "(ขอราคา)"}
                    </Link>
                  </Td>
                  <Td>{vendors[i]?.name ?? "—"}</Td>
                  <Td>{new Date(o.orderDate).toLocaleDateString("th-TH")}</Td>
                  <Td>฿{formatScaled(o.totalAmount, 100)}</Td>
                  <Td>
                    <DocumentStatusBadge status={o.status} />
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
