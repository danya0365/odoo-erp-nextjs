import { requireRole } from "@/src/infrastructure/auth/session";
import { Container } from "@/src/presentation/components/ui/Container";
import { Badge } from "@/src/presentation/components/ui/Badge";

export default async function ShopDashboard() {
  const user = await requireRole("shop_owner");
  return (
    <Container className="py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">แดชบอร์ดร้านค้า</h1>
        <Badge variant="brand">shop_owner</Badge>
      </div>
      <p className="mt-2 text-muted">สวัสดี {user.name} — โมดูลสินค้า/สต๊อกจะมาในรอบถัดไป</p>
    </Container>
  );
}
