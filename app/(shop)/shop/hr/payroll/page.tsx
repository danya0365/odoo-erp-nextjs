import Link from "next/link";
import { Plus, Wallet } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { DocumentStatusBadge } from "@/src/presentation/components/shared/DocumentStatusBadge";
import { PagerNav } from "@/src/presentation/components/shared/PagerNav";
import { DEFAULT_PAGE_SIZE } from "@/src/application/repositories/pagination";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const page = Math.max(1, Number((await searchParams).page ?? "1") || 1);
  const result = await container.payrollRunRepository.list(user.shopId!, { page, pageSize: DEFAULT_PAGE_SIZE, status: "" });
  const runs = result.items;
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "บุคลากร", href: "/shop/hr" },
          { label: "เงินเดือน" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">เงินเดือน</h1>
        <Link href="/shop/hr/payroll/new">
          <Button><Plus className="size-4" />สร้างงวด</Button>
        </Link>
      </div>

      {runs.length === 0 ? (
        <EmptyState icon={Wallet} title="ยังไม่มีงวดเงินเดือน" description="สร้างงวดแรกเพื่อออกสลิปและลงบัญชี" />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>เลขที่</Th>
                <Th>งวด</Th>
                <Th>สถานะ</Th>
              </Tr>
            </THead>
            <TBody>
              {runs.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <Link
                      href={`/shop/hr/payroll/${r.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {r.docNumber ?? "(ร่าง)"}
                    </Link>
                  </Td>
                  <Td>{r.period}</Td>
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
