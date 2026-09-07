import Link from "next/link";
import type { ComponentType } from "react";

interface EmptyStateAction {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
}

/**
 * Reusable empty-state block: icon + heading + description + optional
 * actions. Used wherever a page or section has nothing to show yet (empty
 * cart/wishlist/compare, no search results, no products in a category).
 * Callers own the outer section/spacing so this can sit inside a full page
 * or a smaller inline panel.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actions = [],
  className = "",
  headingLevel: Heading = "h2",
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  className?: string;
  /** Use "h1" only when this is the sole heading on the page (e.g. a standalone empty cart/wishlist page). Defaults to "h2" for use inside a page that already has its own h1. */
  headingLevel?: "h1" | "h2";
}) {
  return (
    <div className={`mx-auto max-w-lg text-center ${className}`}>
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
        <Icon className="h-7 w-7 text-gold-dark" />
      </span>
      <Heading className="mt-6 font-display text-2xl text-ink sm:text-3xl">{title}</Heading>
      <p className="mt-3 text-ink/60">{description}</p>
      {actions.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.variant === "secondary"
                  ? "rounded-md border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-gold hover:text-gold-dark focus-visible:ring-2 focus-visible:ring-gold/40"
                  : "rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold/40"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
