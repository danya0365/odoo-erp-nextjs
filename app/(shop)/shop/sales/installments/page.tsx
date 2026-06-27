import Link from "next/link";
import { Plus, CalendarClock } from "lucide-react";

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

export default async function InstallmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const result = await container.installmentPlanRepository.list(shopId, { page, pageSize: DEFAULT_PAGE_SIZE, status: "" });
  const customers = await Promise.all(result.items.map((p) => container.partnerRepository.findById(shopId, p.customerId)));
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "การขาย", href: "/shop/sales" },
          { label: "ผ่อนชำระ/มัดจำ" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">แผนผ่อนชำระ / มัดจำ</h1>
        <Link href="/shop/sales/installments/new">
          <Button><Plus className="size-4" />ตั้งแผนผ่อนชำระ</Button>
        </Link>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="ยังไม่มีแผนผ่อนชำระ"
          description="ตั้งแผนจากใบแจ้งหนี้ → เก็บมัดจำ + ผ่อนเป็นงวด"
          action={<Link href="/shop/sales/installments/new"><Button size="sm"><Plus className="size-4" />ตั้งแผนผ่อนชำระ</Button></Link>}
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr><Th>ลูกค้า</Th><Th>ยอดรวม</Th><Th>วันที่</Th><Th>สถานะ</Th></Tr>
            </THead>
            <TBody>
              {result.items.map((p, i) => (
                <Tr key={p.id}>
                  <Td>
                    <Link href={`/shop/sales/installments/${p.id}`} className="font-medium text-brand-600 hover:underline">
                      {customers[i]?.name ?? "—"}
                    </Link>
                  </Td>
                  <Td>฿{formatScaled(p.totalAmount, 100)}</Td>
                  <Td>{new Date(p.createdAt).toLocaleDateString("th-TH")}</Td>
                  <Td><DocumentStatusBadge status={p.status} /></Td>
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
