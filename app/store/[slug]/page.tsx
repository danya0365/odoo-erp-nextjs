import { notFound } from "next/navigation";
import { Store, Star } from "lucide-react";

import { container } from "@/src/infrastructure/di/container";
import { ratingSummary, formatAverage } from "@/src/domain/services/review";
import { Container } from "@/src/presentation/components/ui/Container";
import { Card, CardBody } from "@/src/presentation/components/ui/Card";
import { Alert } from "@/src/presentation/components/ui/Alert";
import { StoreFront } from "@/src/presentation/components/storefront/StoreFront";
import { ReviewForm } from "@/src/presentation/components/storefront/ReviewForm";

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reviewed?: string }>;
}) {
  const { slug } = await params;
  const { reviewed } = await searchParams;
  const shop = await container.shopRepository.findBySlug(slug);
  if (!shop || !shop.isActive) notFound();

  const [activeProducts, reviews, ratings] = await Promise.all([
    container.productRepository.listActive(shop.id),
    container.storeReviewRepository.listByShop(shop.id, 20),
    container.storeReviewRepository.ratings(shop.id),
  ]);
  const products = activeProducts.map((p) => ({ id: p.id, name: p.name, salePrice: p.salePrice, taxRateBp: p.taxRateBp }));
  const summary = ratingSummary(ratings);

  return (
    <Container className="space-y-6 py-8">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600">
            <Store className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">{shop.name}</h1>
            <p className="text-sm text-muted">ร้านค้าออนไลน์</p>
          </div>
        </div>
        {summary.count > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{formatAverage(summary.averageX10)}</span>
            <span className="text-muted">({summary.count} รีวิว)</span>
          </div>
        )}
      </header>

      <StoreFront slug={slug} products={products} />

      <section id="reviews" className="space-y-4 border-t border-border pt-6">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Star className="size-5 text-amber-400" />
          รีวิวร้าน
        </h2>

        {reviewed && <Alert variant="success">ขอบคุณสำหรับรีวิว!</Alert>}

        <Card>
          <CardBody>
            <h3 className="mb-3 font-semibold">เขียนรีวิว</h3>
            <ReviewForm slug={slug} />
          </CardBody>
        </Card>

        {reviews.length === 0 ? (
          <p className="text-sm text-muted">ยังไม่มีรีวิว เป็นคนแรกที่รีวิวร้านนี้</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <CardBody className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.customerName}</span>
                    <span className="text-amber-500" aria-label={`${r.rating} ดาว`}>
                      {"★".repeat(r.rating)}
                      <span className="text-muted">{"★".repeat(5 - r.rating)}</span>
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-muted">{r.comment}</p>}
                  <p className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString("th-TH")}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
