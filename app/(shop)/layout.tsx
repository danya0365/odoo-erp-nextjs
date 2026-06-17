import { requireRole } from "@/src/infrastructure/auth/session";
import { AppHeader } from "@/src/presentation/components/layout/AppHeader";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("shop_owner"); // authz จริง
  return (
    <>
      <AppHeader user={user} />
      <main className="flex-1">{children}</main>
    </>
  );
}
