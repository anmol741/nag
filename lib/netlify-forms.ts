// Real submission path for Netlify Forms (https://docs.netlify.com/manage/forms/setup/)
// — the form-handling approach already appropriate for this project, since
// it's deployed on Netlify and needs no custom backend/API of its own.
//
// Each interactive form below is paired with a matching hidden, statically
// rendered replica in `components/NetlifyFormsRegistry.tsx` (mounted in the
// root layout, so it's present in every page's server-rendered HTML,
// including pages this form itself doesn't live on). Netlify's build bot
// only detects forms present in prerendered HTML; some pages using these
// forms (e.g. /enroll, which reads searchParams) render dynamically at
// request time and would otherwise never be seen by that bot.

export class NetlifyFormError extends Error {}

export async function submitNetlifyForm(formName: string, data: Record<string, string>): Promise<void> {
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
