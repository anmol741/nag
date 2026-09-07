// Netlify's build bot detects forms by scanning statically-rendered HTML
// output — it never executes client JavaScript. The real, interactive forms
// in this project (ContactForm, EnrollForm, SignupForm, NewsletterForm) all
// submit correctly at runtime via `lib/netlify-forms.ts`, but some of the
// pages they live on render dynamically (e.g. /enroll reads searchParams),
// so Netlify's crawler would never see them there at build time.
//
// This hidden, server-rendered registry — mounted once in the root layout,
// so it's present on every page including statically-generated ones —
// gives Netlify one static copy of each form (same `name` and field
// `name`s) purely for detection. It is never shown or focusable.
export default function NetlifyFormsRegistry() {
  return (
    <div hidden aria-hidden="true">
      <form name="contact" data-netlify="true" data-netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="contact" />
        <input name="bot-field" />
        <input name="name" />
        <input name="phone" />
        <input name="email" />
        <textarea name="message" />
      </form>

      <form name="enrollment" data-netlify="true" data-netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="enrollment" />
        <input name="bot-field" />
        <input name="firstName" />
        <input name="lastName" />
        <input name="email" />
        <input name="phone" />
        <input name="courseSlug" />
        <input name="courseName" />
        <input name="coursePrice" />
        <textarea name="message" />
        <input name="consent" />
      </form>

      <form name="newsletter-course-updates" data-netlify="true" data-netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="newsletter-course-updates" />
        <input name="bot-field" />
        <input name="name" />
        <input name="phone" />
        <input name="email" />
        <input name="interest" />
        <textarea name="notes" />
      </form>

      <form name="footer-newsletter" data-netlify="true" data-netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="footer-newsletter" />
        <input name="bot-field" />
        <input name="email" />
      </form>
    </div>
  );
}
