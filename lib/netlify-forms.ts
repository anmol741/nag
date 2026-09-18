// Real submission path for Netlify Forms, following the official Next.js /
// OpenNext guidance: https://opennext.js.org/netlify/forms
//
// Modern Next.js doesn't emit one static HTML file per route, so Netlify's
// deploy-time form crawler can't detect forms rendered only by React
// components (especially ones on dynamically-rendered routes, e.g.
// /enroll). `public/__forms.html` is a plain static HTML file with one
// hidden replica of each form purely for that crawler to detect at build
// time — it is never the submission target itself.
//
// The live React forms below POST the encoded body to "/" instead. Netlify's
// forms proxy intercepts any POST request on the site whose body is
// `application/x-www-form-urlencoded` and contains a `form-name` matching a
// form the build-time crawler detected — it captures the submission at the
// edge before the request reaches the Next.js app, regardless of which path
// it was sent to, so "/" is a stable, always-routable target (no redirect,
// no page navigation — the caller's own success/error state handles the UI).
//
// Every real form's field names (and honeypot field name) must stay in
// sync with its declaration in `public/__forms.html`.

export class NetlifyFormError extends Error {}

export async function submitNetlifyForm(formName: string, data: Record<string, string>): Promise<void> {
  if (!formName) {
    throw new NetlifyFormError("Netlify form submission is missing a form name.");
  }

  const body = new URLSearchParams({ "form-name": formName, ...data }).toString();

  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new NetlifyFormError(`Netlify form submission failed with status ${response.status}`);
  }
}
