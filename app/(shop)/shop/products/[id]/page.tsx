import { notFound } from "next/navigation";
import { Boxes } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Breadcrumb } from "@/src/presentation/components/ui/Breadcrumb";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Table, THead, TBody, Tr, Th, Td } from "@/src/presentation/components/ui/Table";
import { ProductForm } from "@/src/presentation/components/inventory/ProductForm";
import { AdjustStockForm } from "@/src/presentation/components/inventory/AdjustStockForm";
import {
  updateProductAction,
  archiveProductAction,
} from "@/src/presentation/actions/product-actions";

const MOVE_TYPE_LABEL: Record<string, string> = {
  in: "รับเข้า",
  out: "จ่ายออก",
  adjust: "ปรับ",
};
const SOURCE_LABEL: Record<string, string> = {
  adjustment: "ปรับสต๊อก",
  delivery: "ส่งของ (ขาย)",
  receipt: "รับของ (ซื้อ)",
};

function signedQty(value: number): string {
  const s = formatScaled(value, QTY_SCALE);
  return value > 0 ? `+${s}` : s;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("shop_owner");
  const { id } = await params;
  const shopId = user.shopId!;

  const product = await container.productRepository.findById(shopId, id);
  if (!product) notFound();

  const [onHand, ledger] = await Promise.all([
    container.stockMoveRepository.onHandByProduct(shopId, id),
    container.stockMoveRepository.listByProduct(shopId, id),
  ]);
  const isStockable = product.type === "stockable";

  return (
    <Container className="max-w-4xl space-y-6 py-8">
      <Breadcrumb
        items={[
          { label: "ร้านค้า", href: "/shop" },
          { label: "สินค้า", href: "/shop/products" },
          { label: product.name },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <form action={archiveProductAction}>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="isActive" value={product.isActive ? "false" : "true"} />
          <Button variant={product.isActive ? "ghost" : "secondary"} size="sm" type="submit">
            {product.isActive ? "เก็บถาวร" : "เปิดใช้งาน"}
          </Button>
        </form>
      </div>

      {isStockable && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="คงเหลือ"
            value={`${formatScaled(onHand, QTY_SCALE)} ${product.uom}`}
            icon={Boxes}
          />
        </div>
      )}

      <Card>
        <CardBody className="space-y-1">
          <h2 className="text-lg font-semibold">ข้อมูลสินค้า</h2>
          <ProductForm
            action={updateProductAction}
            product={product}
            submitLabel="บันทึกการแก้ไข"
          />
        </CardBody>
      </Card>

      {isStockable && (
        <>
          <Card>
            <CardBody className="space-y-3">
              <h2 className="text-lg font-semibold">ปรับสต๊อก</h2>
              <AdjustStockForm productId={product.id} />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3">
              <h2 className="text-lg font-semibold">ประวัติการเคลื่อนไหว</h2>
              {ledger.length === 0 ? (
                <EmptyState
                  icon={Boxes}
                  title="ยังไม่มีการเคลื่อนไหว"
                  description="การปรับสต๊อก/ส่ง/รับของจะปรากฏที่นี่"
                />
              ) : (
                <Table>
                  <THead>
                    <Tr>
                      <Th>วันที่</Th>
                      <Th>ประเภท</Th>
                      <Th>ที่มา</Th>
                      <Th>จำนวน</Th>
                      <Th>หมายเหตุ</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {ledger.map((m) => (
                      <Tr key={m.id}>
                        <Td>{new Date(m.createdAt).toLocaleString("th-TH")}</Td>
                        <Td>{MOVE_TYPE_LABEL[m.type] ?? m.type}</Td>
                        <Td>{SOURCE_LABEL[m.sourceType] ?? m.sourceType}</Td>
                        <Td className={m.qtyDelta < 0 ? "text-error" : "text-success"}>
                          {signedQty(m.qtyDelta)}
                        </Td>
                        <Td>{m.note ?? "—"}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </Container>
  );
}
