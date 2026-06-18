import { notFound } from "next/navigation";
import { Store } from "lucide-react";

import { container } from "@/src/infrastructure/di/container";
import { Container } from "@/src/presentation/components/ui/Container";
import { StoreFront } from "@/src/presentation/components/storefront/StoreFront";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await container.shopRepository.findBySlug(slug);
  if (!shop || !shop.isActive) notFound();

  const page = await container.productRepository.list(shop.id, { page: 1, pageSize: 100, status: "" });
  const products = page.items
    .filter((p) => p.isActive)
    .map((p) => ({ id: p.id, name: p.name, salePrice: p.salePrice, taxRateBp: p.taxRateBp }));

  return (
    <Container className="space-y-6 py-8">
      <header className="flex items-center gap-3 border-b border-border pb-4">
        <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600">
          <Store className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">{shop.name}</h1>
          <p className="text-sm text-muted">ร้านค้าออนไลน์</p>
        </div>
      </header>

      <StoreFront slug={slug} products={products} />
    </Container>
  );
}
