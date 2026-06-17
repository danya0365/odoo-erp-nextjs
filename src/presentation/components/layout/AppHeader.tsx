// แถบบนของพื้นที่ที่ล็อกอินแล้ว — reuse ทุก role group
import { Boxes } from "lucide-react";

import { Container } from "@/src/presentation/components/ui/Container";
import { Button } from "@/src/presentation/components/ui/Button";
import { ThemeSwitcher } from "@/src/presentation/components/theme-switcher";
import { logoutAction } from "@/src/presentation/actions/auth-actions";
import type { User } from "@/src/domain/entities";

export function AppHeader({ user }: { user: User }) {
  return (
    <header className="border-b border-border bg-background">
      <Container className="flex h-16 items-center justify-between gap-4">
        <span className="flex items-center gap-2 font-semibold">
          <Boxes className="size-6 text-brand-500" />
          Odoo ERP
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
          <ThemeSwitcher />
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" type="submit">
              ออกจากระบบ
            </Button>
          </form>
        </div>
      </Container>
    </header>
  );
}
