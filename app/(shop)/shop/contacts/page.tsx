import Link from "next/link";
import { Plus, Users } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { DEFAULT_PAGE_SIZE } from "@/src/application/repositories/pagination";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";
import { Select } from "@/src/presentation/components/ui/Select";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import {
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
} from "@/src/presentation/components/ui/Table";
import { PagerNav } from "@/src/presentation/components/shared/PagerNav";

const TYPE_LABEL: Record<string, string> = {
  customer: "ลูกค้า",
  vendor: "ผู้ขาย",
  both: "ทั้งคู่",
};

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; type?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const search = sp.search?.trim() ?? "";
  const type = sp.type ?? "";

  const result = await container.partnerRepository.list(user.shopId!, {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    search,
    status: type,
  });
  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "ผู้ติดต่อ" }]} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">ผู้ติดต่อ</h1>
        <Link href="/shop/contacts/new">
          <Button>
            <Plus className="size-4" />
            เพิ่มผู้ติดต่อ
          </Button>
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <Input
          name="search"
          defaultValue={search}
          placeholder="ค้นหาชื่อ/อีเมล…"
          className="max-w-xs"
        />
        <div className="w-40">
          <Select name="type" defaultValue={type}>
            <option value="">ทุกประเภท</option>
            <option value="customer">ลูกค้า</option>
            <option value="vendor">ผู้ขาย</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          ค้นหา
        </Button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="ยังไม่มีผู้ติดต่อ"
          description="เริ่มต้นด้วยการเพิ่มลูกค้าหรือผู้ขายรายแรก"
          action={
            <Link href="/shop/contacts/new">
              <Button size="sm">
                <Plus className="size-4" />
                เพิ่มผู้ติดต่อ
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>ชื่อ</Th>
                <Th>ประเภท</Th>
                <Th>อีเมล</Th>
                <Th>โทรศัพท์</Th>
                <Th>สถานะ</Th>
              </Tr>
            </THead>
            <TBody>
              {result.items.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <Link
                      href={`/shop/contacts/${p.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </Td>
                  <Td>{TYPE_LABEL[p.type] ?? p.type}</Td>
                  <Td>{p.email ?? "—"}</Td>
                  <Td>{p.phone ?? "—"}</Td>
                  <Td>
                    {p.isActive ? (
                      <Badge variant="success">ใช้งาน</Badge>
                    ) : (
                      <Badge>เก็บถาวร</Badge>
                    )}
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
