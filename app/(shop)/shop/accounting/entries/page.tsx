import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";

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

const SOURCE_LABEL: Record<string, string> = {
  invoice: "ใบแจ้งหนี้",
  bill: "ใบตั้งหนี้",
  payment: "รับ-จ่ายเงิน",
  manual: "ลงด้วยมือ",
};

export default async function JournalEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const result = await container.journalEntryRepository.list(shopId, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บัญชี", href: "/shop/accounting" },
          { label: "สมุดรายวัน" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">สมุดรายวัน</h1>
        <Link href="/shop/accounting/entries/new">
          <Button>
            <Plus className="size-4" />
            ลงรายการด้วยมือ
          </Button>
        </Link>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="ยังไม่มีรายการบัญชี"
          description="รายการจะถูกสร้างอัตโนมัติเมื่อออกใบแจ้งหนี้/ตั้งหนี้/รับ-จ่ายเงิน"
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>เลขที่</Th>
                <Th>วันที่</Th>
                <Th>ที่มา</Th>
                <Th>อ้างอิง</Th>
                <Th>สถานะ</Th>
              </Tr>
            </THead>
            <TBody>
              {result.items.map((e) => (
                <Tr key={e.id}>
                  <Td>
                    <Link
                      href={`/shop/accounting/entries/${e.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {e.docNumber}
                    </Link>
                  </Td>
                  <Td>{new Date(e.date).toLocaleDateString("th-TH")}</Td>
                  <Td className="text-muted">{SOURCE_LABEL[e.sourceType] ?? e.sourceType}</Td>
                  <Td>{e.ref ?? "—"}</Td>
                  <Td>
                    <DocumentStatusBadge status={e.status} />
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
