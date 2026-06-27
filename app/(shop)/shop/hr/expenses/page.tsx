import Link from "next/link";
import { Plus, ReceiptText } from "lucide-react";

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

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const result = await container.expenseClaimRepository.list(shopId, { page, pageSize: DEFAULT_PAGE_SIZE, status: "" });
  const employees = await Promise.all(result.items.map((c) => container.employeeRepository.findById(shopId, c.employeeId)));
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บุคลากร", href: "/shop/hr" },
          { label: "เบิกค่าใช้จ่าย" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">เบิกค่าใช้จ่ายพนักงาน</h1>
        <Link href="/shop/hr/expenses/new">
          <Button><Plus className="size-4" />ยื่นเบิกใหม่</Button>
        </Link>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="ยังไม่มีใบเบิก"
          description="ยื่นเบิกค่าใช้จ่าย → อนุมัติ → จ่ายคืน + ลงบัญชี"
          action={<Link href="/shop/hr/expenses/new"><Button size="sm"><Plus className="size-4" />ยื่นเบิกใหม่</Button></Link>}
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr><Th>เลขที่</Th><Th>พนักงาน</Th><Th>หมวด</Th><Th>จำนวน</Th><Th>สถานะ</Th></Tr>
            </THead>
            <TBody>
              {result.items.map((c, i) => (
                <Tr key={c.id}>
                  <Td>
                    <Link href={`/shop/hr/expenses/${c.id}`} className="font-medium text-brand-600 hover:underline">{c.docNumber}</Link>
                  </Td>
                  <Td>{employees[i]?.name ?? "—"}</Td>
                  <Td className="text-muted">{c.category}</Td>
                  <Td>฿{formatScaled(c.amount, 100)}</Td>
                  <Td><DocumentStatusBadge status={c.status} /></Td>
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
