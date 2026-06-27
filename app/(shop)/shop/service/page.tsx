import Link from "next/link";
import { Plus, Wrench } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { DEFAULT_PAGE_SIZE } from "@/src/application/repositories/pagination";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { PagerNav } from "@/src/presentation/components/shared/PagerNav";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";

export default async function ServicePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const result = await container.serviceTicketRepository.list(shopId, { page, pageSize: DEFAULT_PAGE_SIZE, status: "" });
  const customers = await Promise.all(result.items.map((t) => container.partnerRepository.findById(shopId, t.customerId)));
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "งานบริการ/ซ่อม" }]} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">งานบริการ / ซ่อม</h1>
        <Link href="/shop/service/new">
          <Button><Plus className="size-4" />เปิดใบงาน</Button>
        </Link>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="ยังไม่มีใบงานบริการ"
          description="เปิดใบงานเมื่อลูกค้าแจ้งปัญหา → มอบหมายช่าง → ปิดงาน"
          action={<Link href="/shop/service/new"><Button size="sm"><Plus className="size-4" />เปิดใบงาน</Button></Link>}
        />
      ) : (
        <Card>
          <Table>
            <THead><Tr><Th>เลขที่</Th><Th>ลูกค้า</Th><Th>เรื่อง</Th><Th>สถานะ</Th></Tr></THead>
            <TBody>
              {result.items.map((t, i) => (
                <Tr key={t.id}>
                  <Td>
                    <Link href={`/shop/service/${t.id}`} className="font-medium text-brand-600 hover:underline">{t.docNumber}</Link>
                  </Td>
                  <Td>{customers[i]?.name ?? "—"}</Td>
                  <Td className="text-muted">{t.subject}</Td>
                  <Td><DocumentStatusBadge status={t.status} /></Td>
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
