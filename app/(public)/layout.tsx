// Public shell — header (โลโก้ + nav placeholder + ThemeSwitcher) + main + footer
import Link from "next/link";
import { Boxes } from "lucide-react";

import { Container } from "@/src/presentation/components/ui/Container";
import { ThemeSwitcher } from "@/src/presentation/components/theme-switcher";

const NAV_LINKS = [
  { href: "#features", label: "คุณสมบัติ" },
  { href: "#pricing", label: "ราคา" },
  { href: "#contact", label: "ติดต่อ" },
  { href: "/showcase", label: "Showcase" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Boxes className="size-6 text-brand-500" />
            <span>Odoo ERP</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <ThemeSwitcher />
        </Container>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <Container className="flex h-16 items-center justify-center text-sm text-muted">
          © 2026 Odoo ERP. สงวนลิขสิทธิ์.
        </Container>
      </footer>
    </>
  );
}
