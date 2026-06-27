import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { PagerNav } from "@/src/presentation/components/shared/PagerNav";
import { DEFAULT_PAGE_SIZE } from "@/src/application/repositories/pagination";

const baht = (v: number | null) => (v === null ? "—" : `฿${formatScaled(v, 100)}`);

export default async function PosSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const page = Math.max(1, Number((await searchParams).page ?? "1") || 1);
  const result = await container.posSessionRepository.list(user.shopId!, { page, pageSize: DEFAULT_PAGE_SIZE, status: "" });
  const sessions = result.items;
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "POS", href: "/shop/pos" },
          { label: "ประวัติกะ" },
        ]}
      />
      <h1 className="text-2xl font-bold">ประวัติกะ POS</h1>

      {sessions.length === 0 ? (
        <EmptyState title="ยังไม่มีกะ" description="เปิดกะแรกที่หน้า POS" />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>เปิดเมื่อ</Th>
                <Th>สถานะ</Th>
                <Th>เงินตั้งต้น</Th>
                <Th>นับจริง</Th>
                <Th>ผลต่าง</Th>
              </Tr>
            </THead>
            <TBody>
              {sessions.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <Link
                      href={`/shop/pos/sessions/${s.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {new Date(s.openedAt).toLocaleString("th-TH")}
                    </Link>
                  </Td>
                  <Td>
                    <Badge variant={s.status === "open" ? "brand" : "success"}>
                      {s.status === "open" ? "เปิดอยู่" : "ปิดแล้ว"}
                    </Badge>
                  </Td>
                  <Td>{baht(s.openingCash)}</Td>
                  <Td>{baht(s.closingCash)}</Td>
                  <Td className={s.difference && s.difference !== 0 ? "text-error" : ""}>
                    {baht(s.difference)}
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
