import { Tag, Star } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { togglePromotionAction } from "@/src/presentation/actions/marketing-actions";
import { formatScaled } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { PromotionForm, ApplyForm, EarnForm, RedeemForm } from "@/src/presentation/components/marketing/MarketingForms";

export default async function MarketingPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  const [promos, accounts, customerPage] = await Promise.all([
    container.promotionRepository.list(shopId),
    container.loyaltyRepository.list(shopId),
    container.partnerRepository.list(shopId, { page: 1, pageSize: 200, status: "customer" }),
  ]);
  const custName = new Map(customerPage.items.map((c) => [c.id, c.name]));
  const options = customerPage.items.filter((c) => c.isActive).map((c) => ({ id: c.id, name: c.name }));

  const promoLabel = (p: (typeof promos)[number]) =>
    p.discountType === "percent" ? `ลด ${p.value}%` : `ลด ฿${formatScaled(p.value, 100)}`;

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb items={[{ label: "ร้านค้า", href: "/shop" }, { label: "การตลาด/แต้ม" }]} />
      <h1 className="text-2xl font-bold">โปรโมชั่น &amp; แต้มสะสม</h1>

      {/* โปรโมชั่น */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Tag className="size-5 text-brand-600" />โปรโมชั่น/คูปอง</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardBody className="space-y-3"><h3 className="font-semibold">สร้างโปรโมชั่น</h3><PromotionForm /></CardBody></Card>
          <Card><CardBody className="space-y-3"><h3 className="font-semibold">คิดส่วนลด (เช็คเงื่อนไข)</h3><ApplyForm /></CardBody></Card>
        </div>
        {promos.length > 0 && (
          <Card>
            <Table>
              <THead><Tr><Th>โค้ด</Th><Th>ส่วนลด</Th><Th>ขั้นต่ำ</Th><Th>สถานะ</Th><Th></Th></Tr></THead>
              <TBody>
                {promos.map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-mono font-medium">{p.code}</Td>
                    <Td>{promoLabel(p)}</Td>
                    <Td className="text-muted">{p.minSpend ? `฿${formatScaled(p.minSpend, 100)}` : "—"}</Td>
                    <Td>{p.isActive ? <Badge variant="success">เปิดใช้</Badge> : <Badge variant="neutral">ปิด</Badge>}</Td>
                    <Td>
                      <form action={togglePromotionAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="active" value={p.isActive ? "false" : "true"} />
                        <Button type="submit" variant="ghost" size="sm">{p.isActive ? "ปิด" : "เปิด"}</Button>
                      </form>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </section>

      {/* แต้มสะสม */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Star className="size-5 text-amber-400" />แต้มสะสมสมาชิก</h2>
        {options.length === 0 ? (
          <EmptyState title="ยังไม่มีลูกค้า" description="เพิ่มผู้ติดต่อประเภทลูกค้าก่อน" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardBody className="space-y-3"><h3 className="font-semibold">สะสมแต้มจากยอดซื้อ (100฿ = 1 แต้ม)</h3><EarnForm customers={options} /></CardBody></Card>
            <Card><CardBody className="space-y-3"><h3 className="font-semibold">แลกแต้ม</h3><RedeemForm customers={options} /></CardBody></Card>
          </div>
        )}
        {accounts.length > 0 && (
          <Card>
            <Table>
              <THead><Tr><Th>ลูกค้า</Th><Th>แต้มคงเหลือ</Th></Tr></THead>
              <TBody>
                {accounts.map((a) => (
                  <Tr key={a.id}>
                    <Td>{custName.get(a.customerId) ?? "—"}</Td>
                    <Td className="font-semibold text-amber-600">{a.points} แต้ม</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </section>
    </Container>
  );
}
