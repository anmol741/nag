import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/session";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Create Account" };
// See app/account/page.tsx's comment — same reasoning applies here.
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  // Already logged in — registering again makes no sense here.
  const session = await getSession();
  if (session) redirect("/account");

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-md px-6">
        <h1 className="text-center font-display text-3xl text-ink">Create Account</h1>
        <p className="mt-3 text-center text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/account" className="text-gold-dark hover:underline">
            Log in
          </Link>
          .
        </p>
        <div className="mt-10">
          <RegisterForm />
        </div>
      </div>
    </section>
  );
}
