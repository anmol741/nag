// Real submission path for Netlify Forms, following the official Next.js /
// OpenNext guidance: https://opennext.js.org/netlify/forms
//
// Modern Next.js doesn't emit one static HTML file per route, so Netlify's
// deploy-time form crawler can't detect forms rendered only by React
// components (especially ones on dynamically-rendered routes, e.g.
// /enroll). `public/__forms.html` is a plain static HTML file with one
// hidden replica of each form purely for that crawler to detect at build
// time.
//
// The live React forms below also POST here at runtime (not to "/"):
// confirmed by request logging that "/" is served by the Next.js app route
// itself (it returns a normal 200 with the full homepage HTML), so Netlify's
// forms proxy never gets a chance to intercept the submission there —
// `response.ok` looked like success even though nothing reached Netlify
// Forms. `/__forms.html` is a plain static asset with no app route behind
// it, which is what actually lets Netlify's proxy intercept the POST before
// it falls through to anything else.
//
// Because a misrouted POST can still come back 200 with *some* HTML (as "/"
// did), a status check alone isn't proof of success — DETECTION_MARKER below
// is unique to this static file's <body>, and the response text is checked
// for it so a submission is only reported successful once we've confirmed
// the response actually came from /__forms.html and not from a fallback
// route.
//
// Every real form's field names (and honeypot field name) must stay in
// sync with its declaration in `public/__forms.html`.

const FORMS_ENDPOINT = "/__forms.html";
const DETECTION_MARKER = 'id="netlify-forms-endpoint"';

export class NetlifyFormError extends Error {}

export async function submitNetlifyForm(formName: string, data: Record<string, string>): Promise<void> {
  if (!formName) {
    throw new NetlifyFormError("Netlify form submission is missing a form name.");
  }

  const body = new URLSearchParams({ "form-name": formName, ...data }).toString();

  const response = await fetch(FORMS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new NetlifyFormError(`Netlify form submission failed with status ${response.status}`);
  }

  // A 200 alone isn't sufficient — a misrouted request can still return an
  // unrelated page's HTML with an ok status. Confirm the response body is
  // actually /__forms.html before treating the submission as successful.
  const responseText = await response.text();
  if (!response.url.endsWith(FORMS_ENDPOINT) || !responseText.includes(DETECTION_MARKER)) {
    throw new NetlifyFormError("Netlify form submission did not reach the static form endpoint.");
  }
}
