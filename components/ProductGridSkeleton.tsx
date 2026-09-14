/** Loading placeholder for a product grid, shown by each shop route's loading.tsx while the WooCommerce fetch resolves. */
export default function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-ink/10 bg-white">
          <div className="h-44 w-full animate-pulse bg-cream" />
          <div className="space-y-2 p-5">
            <div className="h-4 w-16 animate-pulse rounded-full bg-ink/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-ink/10" />
            <div className="h-3 w-full animate-pulse rounded bg-ink/10" />
            <div className="h-4 w-20 animate-pulse rounded bg-ink/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
