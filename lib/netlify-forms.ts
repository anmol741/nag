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
// The live React forms below also POST here at runtime (not to "/"): "/" is
// served by the Next.js app route itself, so a POST there never reaches
// Netlify's forms proxy. `/__forms.html` is a plain static asset with no
// app route behind it, which is what lets Netlify's proxy intercept the
// POST.
//
// Netlify's response to a successful AJAX submission is an HTML page (not
// JSON), and its exact contents aren't a contract — confirmed via the
// Netlify dashboard that submissions are stored correctly even though the
// response body isn't a literal echo of /__forms.html. So `response.ok`
// (any 2xx) is the only success signal checked here; don't parse the body
// as JSON and don't require any particular text/marker in it.
//
// Every real form's field names (and honeypot field name) must stay in
// sync with its declaration in `public/__forms.html`.

const FORMS_ENDPOINT = "/__forms.html";

export class NetlifyFormError extends Error {}

export async function submitNetlifyForm(formName: string, data: Record<string, string>): Promise<void> {
  const body = new URLSearchParams({ "form-name": formName, ...data }).toString();

  const response = await fetch(FORMS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new NetlifyFormError(`Netlify form submission failed with status ${response.status}`);
  }
}
