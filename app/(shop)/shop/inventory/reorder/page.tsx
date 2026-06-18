import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { GetReplenishmentUseCase } from "@/src/application/use-cases/inventory/GetReplenishmentUseCase";
import { formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { setReorderRuleAction } from "@/src/presentation/actions/inventory-actions";

const qty = (v: number) => formatScaled(v, QTY_SCALE);

export default async function ReorderPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { rows, toReorder } = await new GetReplenishmentUseCase(
    container.reorderRuleRepository,
    container.stockMoveRepository,
    container.productRepository,
  ).execute(shopId);

  return (
    <Container className="space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "คลังสินค้า", href: "/shop/inventory" },
          { label: "จุดสั่งซื้อซ้ำ" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">จุดสั่งซื้อซ้ำ</h1>
        <Badge variant={toReorder > 0 ? "warning" : "success"}>
          {toReorder > 0 ? `ต้องเติม ${toReorder} รายการ` : "สต๊อกเพียงพอ"}
        </Badge>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="ยังไม่มีสินค้าแบบนับสต๊อก" description="เพิ่มสินค้าประเภท stockable ก่อน" />
      ) : (
        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>สินค้า</Th>
                <Th>คงเหลือ</Th>
                <Th>ขั้นต่ำ / สูงสุด</Th>
                <Th>ควรเติม</Th>
              </Tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <Tr key={r.productId}>
                  <Td>
                    <span className="font-medium">{r.name}</span>
                    <span className="block text-xs text-muted">{r.sku}</span>
                  </Td>
                  <Td>{qty(r.onHand)}</Td>
                  <Td>
                    <form action={setReorderRuleAction} className="flex items-center gap-2">
                      <input type="hidden" name="productId" value={r.productId} />
                      <Input
                        name="minQty"
                        aria-label={`ขั้นต่ำ ${r.sku}`}
                        defaultValue={qty(r.minQty)}
                        inputMode="decimal"
                        className="w-20"
                      />
                      <span className="text-muted">/</span>
                      <Input
                        name="maxQty"
                        aria-label={`สูงสุด ${r.sku}`}
                        defaultValue={qty(r.maxQty)}
                        inputMode="decimal"
                        className="w-20"
                      />
                      <Button type="submit" variant="secondary" size="sm">บันทึก</Button>
                    </form>
                  </Td>
                  <Td>
                    {r.suggestion > 0 ? (
                      <Badge variant="warning">{qty(r.suggestion)}</Badge>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
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
