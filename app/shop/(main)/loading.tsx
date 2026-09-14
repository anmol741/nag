import ProductGridSkeleton from "@/components/ProductGridSkeleton";

export default function ShopLoading() {
  return (
    <>
      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-light">
            Wholesale Beauty Supplies
          </p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">Shop Online</h1>
        </div>
      </section>
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl text-ink">All Products</h2>
          <div className="mt-6 grid gap-10 md:grid-cols-[220px_1fr]">
            <div className="hidden md:block" />
            <ProductGridSkeleton count={8} />
          </div>
        </div>
      </section>
    </>
  );
}
