import type { Metadata } from "next";
import SignupForm from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Sign up for course updates and our newsletter from Nag's Beauty Supplies & Training Center.",
};

export default function SignupPage() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-xl px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">Stay In The Loop</p>
          <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">Sign Up</h1>
          <p className="mt-3 text-ink/60">
            Tell us what you&rsquo;re interested in and we&rsquo;ll reach out with course dates,
            availability, and news from Nag&rsquo;s.
          </p>
        </div>
        <div className="mt-10">
          <SignupForm />
        </div>
      </div>
    </section>
  );
}
