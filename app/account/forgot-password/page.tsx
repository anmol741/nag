import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/PasswordResetForms";

export const metadata: Metadata = { title: "Reset Password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-md px-6">
        <h1 className="text-center font-display text-3xl text-ink">Reset Password</h1>
        <div className="mt-10">
          <ForgotPasswordForm />
        </div>
      </div>
    </section>
  );
}
