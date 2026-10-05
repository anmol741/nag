import type { Metadata } from "next";
import Link from "next/link";
import { VerifyEmailPanel } from "@/components/PasswordResetForms";

export const metadata: Metadata = { title: "Verify Your Email", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ uid?: string; token?: string }> }) {
  const { uid, token } = await searchParams;
  const valid = typeof uid === "string" && /^[1-9]\d{0,11}$/.test(uid) && typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-md px-6">
        <h1 className="text-center font-display text-3xl text-ink">Verify Your Email</h1>
        <div className="mt-10">
          {valid ? (
            <VerifyEmailPanel uid={uid} token={token} />
          ) : (
            <p className="text-center text-sm text-ink/70">
              This verification link is invalid or incomplete.{" "}
              <Link href="/account" className="text-gold-dark hover:underline">
                Log in
              </Link>{" "}
              to request a new one.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
