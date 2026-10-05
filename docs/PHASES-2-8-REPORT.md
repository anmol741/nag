# Nag's Beauty — Phases 2–8 report

Branch: `feature/accounts-checkout-phases-2-8` (local only, not committed, not pushed). Date: 2026-10-06.

## Important context first

WooCommerce's REST API **cannot verify a customer's password**, and it has no hooks for email verification, approval, e-Transfer, pickup-ready emails or scheduled cancellation. The live WordPress site has no plugin that does this either. I checked its REST namespaces: no JWT or customer-auth plugin is installed.

So this work has two parts:

1. **Next.js storefront changes.** Done, built, linted, type-checked and tested.
2. **A WordPress plugin, "Nag's Headless Bridge"** (`wordpress/nags-headless-bridge/`). It runs inside WordPress and uses WooCommerce's own code for passwords, carts, coupons, tax, shipping, stock and orders. Next.js calls it server-to-server with HMAC-signed requests.

**The plugin has not been run on a WordPress install.** PHP isn't available on this machine, and nothing was installed on the live site, as instructed. I parse-checked it and cross-checked every class and method reference, but it must be installed on a **staging copy** and put through the test plan in its README before production. Until it is installed and configured, the storefront honestly reports login, registration and checkout as "temporarily unavailable". Nothing is faked.

---

## 1. Files changed

**Next.js: modified**

| Area | Files |
|---|---|
| Account pages | `app/account/page.tsx`, `app/account/{orders,orders/[id],addresses,details}/page.tsx` |
| Auth/account APIs | `app/api/auth/{login,logout,register}/route.ts`, `app/api/account/{addresses,details}/route.ts` |
| Checkout | `app/checkout/page.tsx`, `app/checkout/CheckoutPageClient.tsx` |
| Enroll | `app/enroll/page.tsx`, `components/EnrollForm.tsx` (one optional link only) |
| Wishlist | `app/wishlist/WishlistPageClient.tsx`, `components/WishlistButton.tsx` |
| Components | `components/{AccountDetailsForm,AccountNavigation,CartSummary,CheckoutSummary,Header,LoginForm,RegisterForm}.tsx` |
| Server libs | `lib/server/{csrf,rate-limit,require-session,session,woocommerce-admin,wp-auth}.ts` |
| Config | `lib/site-config.ts`, `next.config.ts`, `.env.example` |
| Packages | `package.json`, `package-lock.json` (Next 16.3.4 → 16.3.8 security patch; `test` and `typecheck` scripts) |

**Next.js: new**

| Area | Files |
|---|---|
| Pages | `app/account/{forgot-password,reset-password,verify-email}/page.tsx`, `app/enroll/pay/page.tsx` |
| Auth/account APIs | `app/api/auth/{forgot-password,reset-password,verify-email,resend-verification}/route.ts`, `app/api/account/wishlist/route.ts` |
| Checkout/course APIs | `app/api/checkout/{quote,order}/route.ts`, `app/api/courses/order/route.ts` |
| Components | `components/{AccountStatusNotice,AccountUnavailable,CoursePaymentForm,ETransferInstructions,PasswordResetForms}.tsx` |
| Security libs | `lib/security/{origin,upload,bridge-signing}.ts` |
| Checkout libs | `lib/checkout/{validation,types}.ts` |
| Server libs | `lib/server/{bridge,checkout,course-payments,page-session}.ts`, `lib/wishlist.ts` |
| Scheduled job | `netlify/functions/cancel-unpaid-etransfer.mts` |
| Tests | `tests/*.test.ts`, `tests/setup/*` |

**WordPress plugin: new**

- `wordpress/nags-headless-bridge/nags-headless-bridge.php` and `README.md`
- `includes/class-nag-{bridge-auth,rate-limit,settings,emails,certifications,accounts,admin-approvals,wishlist,checkout,memory-session,etransfer-gateway,orders,courses,rest}.php`

## 2. Features completed

**Accounts**
- Login against existing WordPress customers, using WordPress's own password hashes. Logout revokes the WordPress session token.
- Forgot/reset password through WordPress's own reset keys, on storefront pages. A reset logs the account out everywhere.
- Account overview with live status (email verified, approval, wholesale access).
- Saved billing/shipping addresses, order history, and order details with payment, delivery, discount, tax and pickup state.

**Registration**
- Fields: first/last name, email, phone, salon, password and confirmation, terms agreement, and a **certification file upload** (replaces the old text field).
- New accounts start unverified, pending approval, with wholesale off.
- Verification email; admin notification; an admin approve/reject workflow in **Users**, with certification download.
- Wholesale access switches on only when the account is verified **and** approved.

**Checkout**
- Canada-only billing and shipping (enforced in the browser, in Next.js, and in WordPress).
- Shipping rates come from WooCommerce zones, plus Langley local pickup.
- WooCommerce calculates tax and validates coupons.
- Server-side stock, quantity and variation checks.
- Customer notes, terms agreement, and an order summary built entirely from WooCommerce numbers.
- Checkout is for verified and approved accounts. Existing customers can check out via a setting (default on). **No guest checkout:** it wasn't supported before and wasn't invented.

**Orders**
- Real WooCommerce orders through `WC_Checkout::create_order()`.
- Duplicate protection: an idempotency key per checkout, an atomic lock, and "return the existing order on retry".
- If the total changed since the customer last saw it, the order is refused so they can review the new amount.

**e-Transfer**
- Offline gateway: the order is created on-hold (unpaid). Instructions for `info@nagsbeautysupply.com` appear at checkout, on the order page, and in the WooCommerce on-hold email.
- Unpaid orders are cancelled after 3 days by WP-Cron, plus an hourly Netlify scheduled function. WooCommerce restores the stock.

**Local pickup**
- Pickup option showing Monday–Friday, 10:00 AM–4:30 PM.
- "Ready for pickup" status and order action. The customer gets exactly one email.

**Courses**
- Full payment, or a deposit set in WooCommerce settings (never hard-coded). The order keeps course, student, price, payment type, amount due/paid, remaining balance and policy acceptance.
- **Off by default** (`COURSE_ONLINE_PAYMENTS_ENABLED`).

**Emails**
- All 15 types: 11 sent by the plugin, 4 by WooCommerce's own emails (see the plugin README).

**Wishlist**
- Synced to the account. The guest list is merged once at login with no duplicates. Afterwards the account copy is authoritative.
- Cleared from the browser at logout. Customers can only reach their own.

## 3. Bugs fixed

- **Live 403 on registration.** Confirmed by request: pages opened on Netlify branch/deploy URLs (e.g. `main--taupe-buttercream-c55e75.netlify.app`) report the *primary* URL as `request.url`, so the origin check rejected every POST. It's replaced with a strict allowlist: configured origins plus that same site's Netlify deploy subdomains. Other origins and other Netlify sites are still rejected (tested).
- Account pages trusted the cookie signature alone, so a copied cookie survived logout. Sessions are now verified against WordPress, and pages fail closed if WordPress can't be reached.
- The cart page showed a disabled coupon box and presented fixed 5% GST + 7% PST as final. These are now labelled as estimates; final amounts come from WooCommerce at checkout.
- The rate-limit IP came from the spoofable first `X-Forwarded-For` hop. It now uses Netlify's own `x-nf-client-connection-ip`.
- A missing `SESSION_SECRET` would have let WordPress verify a correct password and then crash while creating the cookie. Login now returns "temporarily unavailable" before any password is sent.

## 4. Environment variables (Netlify, server-only)

| Variable | Required | Notes |
|---|---|---|
| `SESSION_SECRET` | yes | `openssl rand -base64 32` |
| `WORDPRESS_BRIDGE_SECRET` | yes | `openssl rand -hex 32`; identical to `NAG_BRIDGE_SECRET` in wp-config.php |
| `WOOCOMMERCE_CONSUMER_KEY` / `_SECRET` | yes | Read/Write REST keys |
| `NEXT_PUBLIC_SITE_URL` | yes | Already set |
| `WORDPRESS_BRIDGE_URL`, `WOOCOMMERCE_STORE_URL` | optional | Default `https://nagsbeautysupply.com` |
| `ALLOWED_ORIGINS`, `ALLOW_NETLIFY_DEPLOY_ORIGINS` | optional | Extra exact origins / turn off deploy-subdomain acceptance |
| `SESSION_TTL_HOURS` | optional | Default 72 |
| `COURSE_ONLINE_PAYMENTS_ENABLED` | optional | `true` to enable `/enroll/pay` |

## 5. WordPress/WooCommerce configuration

See `wordpress/nags-headless-bridge/README.md` → *Install*. In short:

1. Back up.
2. Upload and activate the plugin on **staging**.
3. Add `NAG_BRIDGE_SECRET`, `NAG_FRONTEND_URL` and `NAG_CERT_DIR` to wp-config.
4. Create REST API keys.
5. Check the e-Transfer gateway settings.
6. Fill in the Nag's Beauty settings tab.
7. Check the Canada shipping zone and the WooCommerce emails.
8. Add a real server cron for `wp-cron.php`.

## 6. Database / metadata changes

- **No tables created or altered.** No existing data is rewritten.
- New user meta (`nag_*`, `_nag_*`) and order meta (`_nag_*`) are listed in the plugin README.
- Transients and options are used only for rate limits, nonces and short locks.
- New custom order status `wc-nag-ready-pickup`.
- Existing customers have no `_nag_registration_source`, and are treated as "existing customer": never forced to re-verify.

## 7. Tests performed

| Test | Result |
|---|---|
| `npm test`: 45 automated tests (node:test) | **45/45 pass** |
| Local production server smoke test: 18 routes | All expected statuses |

The 45 automated tests cover:
- origin allowlist, including the 403 regression
- upload validation (magic bytes, disguised HTML/SVG/EXE, size, names)
- checkout input validation (Canada-only, quantities, IDs, coupons, idempotency keys, notes, course prices)
- bridge signing and a PHP test vector
- **API route integration with the real route handlers:** registration success/failure paths, duplicate email, WordPress down, identical responses for wrong-password vs unknown-email, login rate limiting, misconfiguration not leaking as "wrong password", forgot-password non-enumeration, and the checkout CSRF block

The smoke test also confirmed:
- all 5 policy pages intact
- protected pages redirect to login
- `/enroll/pay` returns 404 while disabled
- security headers present
- no external scripts or styles on any page, so the CSP won't block them

**Not tested, and why:**
- Anything needing a running WordPress with the plugin: real login, emails, approval, order creation, stock, coupons, tax, cancellation, pickup emails, wishlist persistence.
- Browser checks: real-browser checks of desktop/mobile layout, keyboard navigation and the console. The Chrome extension wasn't connected. Forms use labelled inputs, fieldsets/legends, `aria-invalid`, `aria-live` and focus rings, but a manual pass is still needed.
- No real payment was processed. e-Transfer charges nothing anyway.

## 8. Lint, type-check, build

- `eslint .`: **0 problems**
- `tsc --noEmit`: **0 errors**
- `next build` (Next 16.3.8): **success**, 62 pages. Static pages remain static.
- `npm audit --omit=dev`: **0 vulnerabilities**. That's after the Next patch for GHSA-vcvr-r3jv-pc5j. The app doesn't use `next/og`, but the patch was applied anyway.
- 6 "high" advisories remain in the **dev-only** ESLint toolchain (`brace-expansion`, `braces`). They aren't shipped, and fixing them needs a forced breaking upgrade.

## 9. Security improvements

- Strict origin allowlist and `Sec-Fetch-Site` check on every mutating route.
- `SameSite=Lax`, HttpOnly, Secure `__Host-` session cookie, revocable through WordPress session tokens. 72 h expiry.
- HMAC-signed, timestamped, nonce-replay-protected server-to-server bridge. Secrets live only in env vars and wp-config.
- Rate limits in two layers: in Next.js memory, and shared in WordPress, keyed by client IP and by email. They cover login, registration, verification, password reset, checkout and wishlist.
- Non-enumerating login, forgot-password and resend-verification responses, with login timing equalised.
- Staff and admin accounts can't log in through the storefront. This keeps WordPress 2FA (Really Simple Security) from being bypassed.
- Upload checks: extension, MIME type and magic bytes in both Next.js and PHP, plus `finfo`. 4 MB limit, random filename, private directory with deny rules, staff-only nonce-checked download served as an attachment with nosniff and a sandbox CSP.
- IDOR protection: the customer ID always comes from the verified session. Order ownership is checked, and a missing order and someone else's order look identical.
- Prices, discounts, tax and shipping come only from WooCommerce. A "total changed" guard and idempotent orders are in place.
- Security headers: CSP, HSTS (production), nosniff, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy, COOP. `no-store` on all account, checkout and auth APIs.
- Safe errors (no stack traces or internals). Logs never contain passwords, tokens, documents or bodies.
- Open-redirect protection via `returnTo`, unchanged.

**Remaining risks (honest):**
- The CSP uses `'unsafe-inline'` for scripts. Nonces would make every page dynamic; that's Next's documented trade-off.
- The in-memory rate limit is per-instance. The WordPress layer is the shared one.
- Verified sessions are cached for up to 30 s per server instance, so a logout elsewhere can take up to 30 s to apply.
- `.htaccess` protection only works on Apache/LiteSpeed. Set `NAG_CERT_DIR` outside the web root.
- WP-Cron depends on traffic; mitigated by the server cron and the Netlify schedule.
- The storefront login skips WordPress `authenticate` filters (necessary, or every customer shares Netlify's IP for lockouts). Security-plugin login lockouts therefore don't apply to it; the bridge's own limits replace them.
- The plugin is untested on a live WordPress (see above). Nothing here makes the site "unhackable".

## 10. Blocked by missing business information

1. **Course deposit amount.** The setting exists and is blank, so the deposit option is hidden.
2. **Whether course fees are taxable.** The setting exists and is off.
3. **Wholesale pricing mechanism.** Which plugin or role gives wholesale prices? The bridge can add a configured role on approval; no such plugin is detected on the site today.
4. **Existing customers.** May they order without re-approval? The default is yes (setting). Should they get wholesale access automatically? The default is no; staff approve them in Users.
5. **Other payment methods** (card, pay-at-pickup). Only e-Transfer was confirmed.
6. **Shipping rates/zones.** These come from WooCommerce settings and need confirming.
7. **Variable products.** The catalogue has none today. Server-side variation validation is ready, but there's no option picker in the UI.
8. **Guest course payments.** `/enroll/pay` allows paying without an account when enabled. Confirm before enabling.
9. **GlyMed.** Still hidden in the storefront and blocked by the bridge at checkout. Waiting on permission.

## 11. Deployment steps

1. **Staging WordPress.** Clone the site in Hostinger (staging), then install and configure the plugin per its README.
2. **Netlify environment.** In a deploy preview, set the env vars from §4, pointing `WORDPRESS_BRIDGE_URL` at the **staging** WordPress.
3. **Test the preview.** Push the branch (when you approve) and run the plugin README's staging test plan against the preview URL.
4. **Production WordPress.** When it all passes: back up production, install and activate the plugin, set wp-config constants and settings.
5. **Production Netlify.** Set the production env vars (bridge URL = `https://nagsbeautysupply.com`) and merge to `main`. Netlify deploys and starts the hourly scheduled function.
6. **Smoke test.** Register a test account, verify, approve, place an e-Transfer pickup order, mark it ready, then cancel it to restore stock.

## 12. Rollback plan

- **Storefront:** in Netlify, *Deploys* → publish the previous deploy (instant), or revert the merge commit. The previous deploy has no checkout, so nothing breaks.
- **Plugin:** deactivate it. The storefront shows "temporarily unavailable" for accounts and checkout; browsing, cart, courses, forms and policy pages are unaffected. Meta is additive and can stay. Orders already placed remain normal WooCommerce orders.
- **Full restore:** if anything unexpected happened in WordPress, restore the backup taken at step 4.
- **Env vars:** removing `WORDPRESS_BRIDGE_SECRET` alone disables every bridge call immediately.
