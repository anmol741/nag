import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/PasswordResetForms";

export const metadata: Metadata = { title: "Choose a New Password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ key?: string; login?: string }> }) {
  const { key, login } = await searchParams;
  // Shape check only — WordPress validates the key itself.
  const valid = typeof key === "string" && /^[A-Za-z0-9]{10,64}$/.test(key) && typeof login === "string" && login.length > 0 && login.length <= 254;

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-md px-6">
        <h1 className="text-center font-display text-3xl text-ink">Choose a New Password</h1>
        <div className="mt-10">
          {valid ? (
            <ResetPasswordForm login={login} resetKey={key} />
          ) : (
            <p className="text-center text-sm text-ink/70">
              This password reset link is invalid or incomplete.{" "}
              <Link href="/account/forgot-password" className="text-gold-dark hover:underline">
                Request a new link
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
