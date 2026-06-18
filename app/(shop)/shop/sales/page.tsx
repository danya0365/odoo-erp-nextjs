import Link from "next/link";
import { Plus, FileText } from "lucide-react";

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

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const status = sp.status ?? "";

  const result = await container.salesOrderRepository.list(shopId, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status,
  });
  const customers = await Promise.all(
    result.items.map((o) => container.partnerRepository.findById(shopId, o.customerId)),
  );
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "การขาย" }]} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">การขาย</h1>
        <Link href="/shop/sales/new">
          <Button>
            <Plus className="size-4" />
            สร้างใบเสนอราคา
          </Button>
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <div className="w-48">
          <Select name="status" defaultValue={status}>
            <option value="">ทุกสถานะ</option>
            <option value="draft">ร่าง</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="partially_delivered">ส่งบางส่วน</option>
            <option value="delivered">ส่งครบแล้ว</option>
            <option value="invoiced">วางบิลแล้ว</option>
            <option value="done">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">กรอง</Button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="ยังไม่มีใบขาย"
          description="เริ่มต้นด้วยการสร้างใบเสนอราคาแรก"
          action={
            <Link href="/shop/sales/new">
              <Button size="sm"><Plus className="size-4" />สร้างใบเสนอราคา</Button>
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
                <Th>ยอดรวม</Th>
                <Th>สถานะ</Th>
              </Tr>
            </THead>
            <TBody>
              {result.items.map((o, i) => (
                <Tr key={o.id}>
                  <Td>
                    <Link
                      href={`/shop/sales/${o.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {o.docNumber ?? "(ร่าง)"}
                    </Link>
                  </Td>
                  <Td>{customers[i]?.name ?? "—"}</Td>
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
