import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";

export default async function ProjectsPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const projects = await container.projectRepository.list(shopId);
  const customers = await Promise.all(
    projects.map((p) => (p.customerId ? container.partnerRepository.findById(shopId, p.customerId) : Promise.resolve(null))),
  );

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "โครงการ" }]} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">โครงการ</h1>
        <Link href="/shop/projects/new">
          <Button><Plus className="size-4" />สร้างโครงการ</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="ยังไม่มีโครงการ" description="สร้างโครงการแรกเพื่อจัดการงานและลงเวลา" />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>ชื่อโครงการ</Th>
                <Th>ลูกค้า</Th>
                <Th>สถานะ</Th>
              </Tr>
            </THead>
            <TBody>
              {projects.map((p, i) => (
                <Tr key={p.id}>
                  <Td>
                    <Link href={`/shop/projects/${p.id}`} className="font-medium text-brand-600 hover:underline">
                      {p.name}
                    </Link>
                  </Td>
                  <Td>{customers[i]?.name ?? "—"}</Td>
                  <Td>
                    <Badge variant={p.status === "active" ? "brand" : "neutral"}>
                      {p.status === "active" ? "กำลังดำเนินการ" : "ปิดแล้ว"}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </Container>
  );
}
