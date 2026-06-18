import Link from "next/link";
import { Users, Package, FileText, ShoppingCart, Calculator, Target, ArrowRight } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";

const MODULES = [
  { href: "/shop/crm", label: "CRM", desc: "ไปป์ไลน์โอกาสการขาย", icon: Target },
  { href: "/shop/contacts", label: "ผู้ติดต่อ", desc: "ลูกค้าและผู้ขาย", icon: Users },
  { href: "/shop/products", label: "สินค้า", desc: "สินค้าและสต๊อก", icon: Package },
  { href: "/shop/sales", label: "การขาย", desc: "ใบเสนอราคา→ส่ง→วางบิล→ชำระ", icon: FileText },
  { href: "/shop/purchase", label: "การจัดซื้อ", desc: "ขอราคา→รับของ→ตั้งหนี้→จ่าย", icon: ShoppingCart },
  { href: "/shop/accounting", label: "บัญชี", desc: "สมุดรายวัน→ผังบัญชี→งบทดลอง", icon: Calculator },
];

export default async function ShopDashboard() {
  const user = await requireRole("shop_owner");
  return (
    <Container className="space-y-6 py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">แดชบอร์ดร้านค้า</h1>
        <Badge variant="brand">shop_owner</Badge>
      </div>
      <p className="text-muted">สวัสดี {user.name}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.href} href={m.href}>
              <Card className="transition-colors hover:border-brand-300">
                <CardBody className="flex items-start gap-4">
                  <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600">
                    <Icon className="size-6" />
                  </span>
                  <div className="flex-1">
                    <h3 className="flex items-center gap-1 font-semibold">
                      {m.label}
                      <ArrowRight className="size-4 text-muted" />
                    </h3>
                    <p className="mt-0.5 text-sm text-muted">{m.desc}</p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
