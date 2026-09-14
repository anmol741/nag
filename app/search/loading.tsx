import ProductGridSkeleton from "@/components/ProductGridSkeleton";

export default function SearchLoading() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">Shop Online</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Search Products</h1>
      </div>
      <div className="mx-auto mt-12 max-w-6xl px-6">
        <ProductGridSkeleton count={8} />
      </div>
    </section>
  );
}
