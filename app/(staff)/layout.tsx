import { requireRole } from "@/src/infrastructure/auth/session";
import { AppHeader } from "@/src/presentation/components/layout/AppHeader";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("staff"); // authz จริง
  return (
    <>
      <AppHeader user={user} />
      <main className="flex-1">{children}</main>
    </>
  );
}
