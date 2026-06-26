"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Minus, ShoppingCart } from "lucide-react";

import { computeLine, parseScaled, formatScaled, QTY_SCALE } from "@/src/domain/services/money";
import { placeOrderAction, type FormState } from "@/src/presentation/actions/storefront-actions";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";
import { FormField } from "@/src/presentation/components/ui/FormField";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { Badge } from "@/src/presentation/components/ui/Badge";

export interface StoreProduct {
  id: string;
  name: string;
  salePrice: number;
  taxRateBp: number;
}

export function StoreFront({ slug, products }: { slug: string; products: StoreProduct[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(placeOrderAction, {});
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const add = (id: string) => setQtyById((q) => ({ ...q, [id]: (q[id] ?? 0) + 1 }));
  const sub = (id: string) => setQtyById((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) - 1) }));

  const cart = Object.entries(qtyById).filter(([, n]) => n > 0);
  const total = cart.reduce((sum, [id, n]) => {
    const p = productMap.get(id);
    return p ? sum + computeLine(parseScaled(String(n), QTY_SCALE), p.salePrice, p.taxRateBp).total : sum;
  }, 0);
  const linesJson = JSON.stringify(cart.map(([id, n]) => ({ productId: id, qty: String(n) })));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {products.length === 0 ? (
          <p className="text-muted">ยังไม่มีสินค้าวางจำหน่าย</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((p) => (
              <Card key={p.id}>
                <CardBody className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-brand-600">฿{formatScaled(p.salePrice, 100)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="sm" aria-label={`ลด ${p.name}`} onClick={() => sub(p.id)}>
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-6 text-center" aria-label={`จำนวน ${p.name}`}>{qtyById[p.id] ?? 0}</span>
                    <Button type="button" variant="secondary" size="sm" aria-label={`เพิ่ม ${p.name}`} onClick={() => add(p.id)}>
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="h-fit">
        <CardBody className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingCart className="size-5" />
            ตะกร้า
            <Badge variant="brand">{cart.length}</Badge>
          </h2>

          {cart.length === 0 ? (
            <p className="text-sm text-muted">ยังไม่มีสินค้าในตะกร้า</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {cart.map(([id, n]) => {
                const p = productMap.get(id);
                if (!p) return null;
                return (
                  <li key={id} className="flex justify-between">
                    <span>{p.name} × {n}</span>
                    <span>฿{formatScaled(computeLine(parseScaled(String(n), QTY_SCALE), p.salePrice, p.taxRateBp).total, 100)}</span>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-right text-lg font-bold">รวม ฿{formatScaled(total, 100)}</p>

          <form action={formAction} className="space-y-3 border-t border-border pt-4">
            {state.error && <Alert variant="error">{state.error}</Alert>}
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="lines" value={linesJson} />
            <FormField label="ชื่อผู้สั่งซื้อ" required>
              <Input name="name" />
            </FormField>
            <FormField label="อีเมล" required>
              <Input name="email" type="email" />
            </FormField>
            <FormField label="โทรศัพท์">
              <Input name="phone" />
            </FormField>
            <Button type="submit" disabled={pending || cart.length === 0} className="w-full">
              {pending ? "กำลังสั่งซื้อ…" : "ยืนยันสั่งซื้อ"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
