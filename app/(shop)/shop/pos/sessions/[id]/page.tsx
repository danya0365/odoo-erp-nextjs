import { notFound } from "next/navigation";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

const baht = (v: number | null) => (v === null ? "—" : `฿${formatScaled(v, 100)}`);
const METHOD: Record<string, string> = { cash: "เงินสด", transfer: "โอน" };

export default async function PosSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { id } = await params;

  const session = await container.posSessionRepository.findById(shopId, id);
  if (!session) notFound();
  const orders = await container.posOrderRepository.listBySession(shopId, id);
  const salesTotal = orders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "POS", href: "/shop/pos" },
          { label: "ประวัติกะ", href: "/shop/pos/sessions" },
          { label: new Date(session.openedAt).toLocaleDateString("th-TH") },
        ]}
      />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">รายละเอียดกะ</h1>
        <Badge variant={session.status === "open" ? "brand" : "success"}>
          {session.status === "open" ? "เปิดอยู่" : "ปิดแล้ว"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="เงินตั้งต้น" value={baht(session.openingCash)} />
        <StatCard label="ยอดขายในกะ" value={baht(salesTotal)} />
        <StatCard label="เงินที่ควรมี" value={baht(session.expectedCash)} />
        <StatCard label="ผลต่าง" value={baht(session.difference)} />
      </div>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-lg font-semibold">บิลขาย ({orders.length})</h2>
          {orders.length === 0 ? (
            <EmptyState title="ไม่มีบิลในกะนี้" description="" />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>เลขที่</Th>
                  <Th>เวลา</Th>
                  <Th>ชำระ</Th>
                  <Th>ยอด</Th>
                </Tr>
              </THead>
              <TBody>
                {orders.map((o) => (
                  <Tr key={o.id}>
                    <Td className="font-medium">{o.docNumber}</Td>
                    <Td>{new Date(o.createdAt).toLocaleTimeString("th-TH")}</Td>
                    <Td>{METHOD[o.paymentMethod] ?? o.paymentMethod}</Td>
                    <Td>{baht(o.totalAmount)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </Container>
  );
}
