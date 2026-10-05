# Nag's Headless Bridge (WordPress plugin)

Server-to-server bridge between the Next.js storefront and WooCommerce. WooCommerce stays the source of truth for customers, passwords, addresses, orders, stock, prices, coupons, tax and shipping.

> **Status: written, syntax-checked, NOT yet run on a WordPress install.** Install it on a **staging copy** of the site first and work through the test plan below before you activate it on production.

## What it adds (and doesn't touch)

| Adds | Never changes |
|---|---|
| REST routes under `/nag-bridge/v1/*`. They are POST-only and HMAC-signed, so browsers can't call them | Existing customers, passwords, addresses, order history |
| Customer meta keys (listed below) | Products, product images, categories, stock levels (stock changes only through WooCommerce's normal order statuses) |
| "Interac e-Transfer" payment method (storefront-only by default) | The WordPress site's own checkout (unless you untick "Storefront only") |
| "Ready for pickup" order status, plus an order action that emails the customer once | GlyMed products (the bridge also refuses to sell them) |
| Hourly WP-Cron job that cancels unpaid e-Transfer orders after 3 days | |
| Users → "Nag's status" column, a "Pending approval" filter, and Approve/Reject | |
| WooCommerce → Settings → **Nag's Beauty** tab | |

## Install (staging first)

1. Back up the database and files (Hostinger backup or All-in-One WP Migration, which is already installed).
2. Upload the `nags-headless-bridge` folder to `wp-content/plugins/`.
3. Add these lines to `wp-config.php`, above `/* That's all, stop editing! */`:
   ```php
   define( 'NAG_BRIDGE_SECRET', 'PASTE-64-HEX-CHARS' );         // same value as WORDPRESS_BRIDGE_SECRET on Netlify
   define( 'NAG_FRONTEND_URL', 'https://taupe-buttercream-c55e75.netlify.app' );
   // Recommended: keep certification uploads outside the public web root.
   define( 'NAG_CERT_DIR', '/home/<hostinger-user>/nag-private-certifications' );
   ```
   Generate the secret with `openssl rand -hex 32`. Never put it in the database, a plugin setting, or git.
4. Activate the plugin in **Plugins**.
5. Go to **WooCommerce → Settings → Payments → Interac e-Transfer** and check it is enabled, the email is `info@nagsbeautysupply.com`, and "Storefront only" is ticked.
6. Go to **WooCommerce → Settings → Nag's Beauty**:
   - Storefront URL
   - Registration notification email
   - Existing customers can order online (default: on)
   - Wholesale role (optional)
   - Course deposit amount (blank means full payment only)
   - Course fee tax (default: off, confirm with your accountant)
7. Go to **WooCommerce → Settings → Shipping**. Make sure there is a **Canada** zone with your shipping method(s). Optionally add WooCommerce "Local pickup"; if you don't, the bridge offers "Local pickup — Langley store" ($0) on the storefront.
8. Go to **WooCommerce → Settings → Emails**. Make sure "New order", "Order on-hold", "Processing order" and "Completed order" are enabled, and the sender name/address are correct. Send a test email through your SMTP plugin.
9. Confirm WP-Cron runs. Better: add a real server cron in Hostinger hPanel → Advanced → Cron Jobs:
   `*/15 * * * * wget -q -O - "https://nagsbeautysupply.com/wp-cron.php?doing_wp_cron" >/dev/null 2>&1`
   (The storefront's Netlify scheduled function also triggers the cancellation every hour.)

## User meta written

| Key | Meaning |
|---|---|
| `nag_salon_name` | Salon/spa name (also copied to `billing_company` at registration) |
| `nag_certification` | `on_file` once a document is stored |
| `_nag_cert_file`, `_nag_cert_mime`, `_nag_cert_name`, `_nag_cert_size`, `_nag_cert_sha256`, `_nag_cert_uploaded_at` | Private certification file record |
| `_nag_registration_source` | `headless` = registered through the storefront. **Absent = existing customer** (never forced to re-verify) |
| `_nag_email_verified` | `yes` / `no` |
| `_nag_email_verify_hash`, `_nag_email_verify_expires` | SHA-256 of the pending verification token (the token itself is never stored), 48 h expiry |
| `_nag_approval_status` | `pending` / `approved` / `rejected` |
| `_nag_approval_at`, `_nag_approval_by`, `_nag_rejection_reason` | Audit trail |
| `_nag_wholesale_access` | `yes` only when verified **and** approved |
| `_nag_terms_accepted_at`, `_nag_registered_at`, `_nag_email_verified_at`, `_nag_last_storefront_login` | Timestamps |
| `_nag_wishlist` | Account wishlist (product IDs) |

## Order meta written

`_nag_idempotency_key`, `_nag_order_source`, `_nag_terms_accepted_at`, `_nag_local_pickup`, `_nag_pickup_ready_emailed_at`, `_nag_payment_confirmed_at`, `_nag_auto_cancelled_at`. Course orders also get `_nag_course_slug`, `_nag_course_title`, `_nag_student_name`, `_nag_student_email`, `_nag_student_phone`, `_nag_course_price`, `_nag_payment_type`, `_nag_amount_due_now`, `_nag_amount_paid`, `_nag_remaining_balance` and `_nag_course_policy_accepted_at`.

No database tables are created or altered.

## Emails

The plugin sends these through WooCommerce's mailer and template:

- email verification
- registration received
- new registration (to admin)
- account approved
- registration rejected
- password reset
- order cancelled after 3 unpaid days
- payment received
- ready for pickup
- course enrollment received
- course deposit received

WooCommerce's own emails cover the rest:

- **New order** (admin)
- **Order on-hold** (the customer confirmation; this plugin injects the e-Transfer instructions into it)
- **Processing order**
- **Completed order**

## Staging test plan

Use test customers only. e-Transfer involves no real payment, because nothing is charged.

1. **Health:** call the signed `/health` route from the storefront server (or from the "Verifying the signature" check below). Expect `{ok:true}`.
2. **Register:** register on the storefront with a PDF. Check:
   - the user appears with role *customer*, status "Pending approval · email not verified"
   - the file is in the certificate directory, and opening its URL directly in a browser gives **403**
   - the admin email arrives
3. **Verify email:** open the emailed link and click Verify. Expect status "verified", plus the "Registration received" email.
4. **Approve:** use Users → Approve. Expect the approval email and `_nag_wholesale_access=yes`. Checkout now works.
5. **Reject:** reject a second test user. Expect the rejection email, and login to fail with the "not approved" message.
6. **Existing customer:** log in to the storefront with an existing customer. Orders and addresses should show, and their WordPress password is unchanged.
7. **Password reset:** use "Lost your password?" on the storefront, then the email link, then set a new password. Old sessions should be logged out.
8. **Checkout:** place an e-Transfer order (pickup and shipping, with and without a coupon). Check that it appears **on-hold**, stock is reduced, the on-hold email shows the instructions, and the admin email arrives. Double-click "Place Order": still only one order.
9. **Cancellation:** on staging, temporarily edit a test order's created date to 4 days ago, then run WP Crontrol "Run now" on `nag_bridge_cancel_unpaid_etransfer`. Expect: cancelled, stock restored, cancellation email sent.
10. **Pickup:** run the order action "Mark ready for local pickup". One email. Run it again: no second email.
11. **Payment received:** change an on-hold order to Processing. Expect the "Payment received" email.

## Verifying the signature (PHP ↔ Node)

`tests/bridge-signing.test.ts` publishes a fixed test vector:

- secret `test-secret-0123456789abcdef0123456789abcdef`
- timestamp `1760000000`
- nonce `0123456789abcdef0123456789abcdef`
- method `POST`
- route `/auth/login`
- body `{"email":"a@b.co"}`

Expected signature: `30fbd86543f80f028f4df74730eb5e5935d860b53e1c508274cb79e0036560dc`

On staging:

```
wp eval 'echo hash_hmac("sha256", implode("\n", ["v1","1760000000","0123456789abcdef0123456789abcdef","POST","/auth/login", hash("sha256", "{\"email\":\"a@b.co\"}")]), "test-secret-0123456789abcdef0123456789abcdef");'
```

The two values must match.

## Rollback

Deactivate the plugin. The storefront then shows "temporarily unavailable" for login, registration and checkout, and browsing, cart and policy pages keep working.

All data written by the plugin is additive meta. Leaving it in place is harmless, and nothing needs to be removed to roll back. Orders already created stay normal WooCommerce orders.
