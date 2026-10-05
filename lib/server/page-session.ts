import "server-only";
import { redirect } from "next/navigation";
import { getVerifiedSession, type VerifiedSession } from "./session";

/**
 * For account Server Components: returns the WordPress-verified session,
 * redirects to the login page when there is none (including a revoked or
 * logged-out cookie), or returns "unavailable" when WordPress can't be
 * reached — pages then show a "try again shortly" message rather than
 * trusting the cookie alone (fail closed).
 *
 * proxy.ts still does the cheap signature check first; this is the
 * authoritative one.
 */
export async function requireAccountPageSession(returnTo: string): Promise<VerifiedSession | "unavailable"> {
  const result = await getVerifiedSession();
  if (result.state === "valid") return result.session;
  if (result.state === "unavailable") return "unavailable";
  redirect(`/account?returnTo=${encodeURIComponent(returnTo)}`);
}
