# Dealer portal

Dealer entry: `/dealers`. Application review: `/admin/dealers` (superadmin or manager). Product and category management: `/admin/products` (superadmin only).

The server applies pending migrations at startup, including `009_dealer_portal.sql` and `010_dealer_catalogue.sql`. Back up the database before deploying and verify migration status. Keep `uploads_private` on a persistent volume; never expose it through a static web-server route. The catalogue replaces the Excel workflow; old price-list routes are no longer mounted. Existing files are preserved, and are not automatically imported.

## Product catalogue

The dealer catalogue uses separate `dealer_categories`, `dealer_products`, and `dealer_product_history` tables. The existing public products and checkout remain separate. The catalogue starts empty; the super admin creates categories and adds products.

Products have a category, name, details, optional brand and product code, pack quantity, unit (`mg`, `gm`, `kg`, `ml`, `litre`, `pcs`), price per pack, GST included/extra, and status (`draft`, `published`, `hidden`, `archived`). No product images, availability, or minimum order fields are used. Only published products are returned to authenticated, currently approved, unblocked distributors. All distributors see the same prices. Queries support search, category filtering, sorting and pagination at 20 products per page.

Add, edit, product details, visibility confirmation and category management open in accessible popup dialogs. Category creation is also available within the product popup. Empty categories can be deleted; categories containing products, including archived products, require moving those products first. Archive preserves the product and its history; restore or edit through the Archived filter. Product changes and price history commit in one transaction, recording old/new price, actor, action and timestamp.

Catalogue endpoints: `/api/admin/catalogue/{products,categories}` and `/api/dealer/catalogue/{products,categories}`. Admin creation uses POST and updates use PUT; `PATCH /products/:id/status` changes visibility without overwriting product details or prices. Only empty categories expose DELETE. Distributor routes are read-only. Admin mutation routes require the existing session and CSRF token. Superadmin authorization is enforced in the backend, independent of the navigation UI.

## Messaging configuration

Set `DEALER_WHATSAPP_PROVIDER=meta`, `META_PHONE_NUMBER_ID`, `META_ACCESS_TOKEN`, `META_GRAPH_API_VERSION` (a supported version for your Meta app), and `META_TEMPLATE_LANGUAGE`. Use a permanent system-user token with the required WhatsApp messaging permissions. Credentials belong in the server environment only.

Create and approve these templates in WhatsApp Manager before enabling Meta delivery:

- `META_DEALER_OTP_TEMPLATE`: authentication template with one OTP body parameter and copy-code URL button at index 0.
- `META_DEALER_APPROVED_TEMPLATE`: utility template with body parameters in order: dealer name, portal URL. Its approved text should invite the dealer to browse the product catalogue, replacing any previous Excel-download wording.
- `META_DEALER_REJECTED_TEMPLATE`: utility template with body parameters in order: dealer name, rejection reason, portal URL.

Set `PUBLIC_SITE_URL` to the frontend HTTPS origin. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `ADMIN_NOTIFY_EMAIL`. Optional dealer emails receive approval/rejection mail when supplied. New registrations send admin email; the admin portal refreshes its pending count every 30 seconds. Decision responses flag notification failures and the server logs them; notification delivery is best effort, without automatic retries.

The existing MSG91 OTP provider remains available with `DEALER_WHATSAPP_PROVIDER=msg91` or an unset provider. Production always disables simple login and OTP exposure even if their development flags are enabled. Keep `VITE_DEALER_LOGIN_MODE=otp`.

## Verification before launch

Use a test dealer number to exercise OTP send, incorrect/expired OTP, registration with both documents, admin review and rejection, corrected resubmission, approval, and catalogue access. Test product/category creation, editing, hide/publish, archive/restore, price history, search/filter/sort and popup behavior. Verify pending, rejected, blocked and unauthenticated dealers cannot read catalogue data, and non-superadmins cannot manage it. Verify real WhatsApp and SMTP delivery using the configured accounts. Apply migrations in staging before checking this flow against MySQL.

API tests use mocks; they do not establish real provider delivery or database migration compatibility. Uploaded registration documents accept PDF/JPEG/PNG up to 8 MB each, checking file signatures. These checks do not replace optional malware scanning.
