"use client";

import { useAuthSession } from "@/lib/auth";

export default function AccountWelcome() {
  const session = useAuthSession();
  if (!session) return null;
  return <p className="mt-2 text-ink/60">Welcome back, {session.email}.</p>;
}
