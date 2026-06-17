import { requireRole } from "@/src/infrastructure/auth/session";
import { Container } from "@/src/presentation/components/ui/Container";
import { Badge } from "@/src/presentation/components/ui/Badge";

export default async function AdminDashboard() {
  const user = await requireRole("platform_admin");
  return (
    <Container className="py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">แผงผู้ดูแลแพลตฟอร์ม</h1>
        <Badge variant="brand">platform_admin</Badge>
      </div>
      <p className="mt-2 text-muted">สวัสดี {user.name} — เนื้อหาเต็มจะมาในรอบถัดไป</p>
    </Container>
  );
}
