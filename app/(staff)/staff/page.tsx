import { requireRole } from "@/src/infrastructure/auth/session";
import { Container } from "@/src/presentation/components/ui/Container";
import { Badge } from "@/src/presentation/components/ui/Badge";

export default async function StaffDashboard() {
  const user = await requireRole("staff");
  return (
    <Container className="py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">หน้าพนักงาน</h1>
        <Badge variant="brand">staff</Badge>
      </div>
      <p className="mt-2 text-muted">สวัสดี {user.name} — งานประจำวันจะมาในรอบถัดไป</p>
    </Container>
  );
}
