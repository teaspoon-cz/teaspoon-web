# Teaspoon

Teaspoon is a static website for [teaspoon.cz](https://teaspoon.cz).

It is hosted on Cloudflare Pages. A Cloudflare Worker backs the contact form: it validates submissions with hCaptcha, stores them in a Cloudflare D1 database, and forwards them by email via Resend. An optional password-protected admin view at `/admin/` lists all received submissions.

---

## hCaptcha Setup

1. Register at [hcaptcha.com](https://hcaptcha.com) and add a new site.
   - Domain: `teaspoon.cz` (add `test.teaspoon.cz` for staging)
2. Copy the **Site Key** and replace `HCAPTCHA_SITE_KEY_PLACEHOLDER` in [web/kontakt/index.html](web/kontakt/index.html).
3. Keep the **Secret Key** — you will need it in the Cloudflare setup step below.

---

## Cloudflare Setup

1. **Create a D1 database**
   - Cloudflare dashboard → Workers & Pages → D1 → Create database
   - Name: `teaspoon-forms`
   - Copy the database ID and paste it into [wrangler.toml](wrangler.toml), replacing `REPLACE_WITH_D1_DATABASE_ID`

2. **Apply the database schema**
   ```
   npx wrangler d1 execute teaspoon-forms --file=schema.sql
   ```

3. **Set encrypted environment variables**
   - Cloudflare dashboard → Workers & Pages → `teaspoon` → Settings → Environment variables
   - Add the following, marked as **Encrypted**:
     - `HCAPTCHA_SECRET_KEY` — the hCaptcha Secret Key from the hCaptcha setup above
     - `ADMIN_PASSWORD` — a strong password for the `/admin/` admin view
     - `RESEND_API_KEY` — the Resend API key from the Resend setup below

4. **Connect the repository in Cloudflare Pages**
   - Cloudflare dashboard → Workers & Pages → Create application → Pages → Connect to Git
   - Select this repository
   - Build settings:
     - Build command: *(leave empty)*
     - Build output directory: `web`
   - Save and deploy

5. **Test**
   - Visit `/kontakt/` and submit the contact form; verify the success message appears
   - Visit `/admin/`, enter the admin password, and confirm the submission shows in the table

---

## Resend Setup

Resend is used to deliver notification emails when a form is submitted.

1. **Create an account** at [resend.com](https://resend.com) (free tier: 3,000 emails/month).

2. **Add and verify the domain**
   - Resend dashboard → Domains → Add domain → enter `teaspoon.cz`
   - Resend will show DNS records to add (SPF, DKIM, DMARC); add them in your DNS provider
   - Wait for verification — the domain status must be **Verified** before emails can be sent from it

3. **Create an API key**
   - Resend dashboard → API Keys → Create API Key
   - Name it (e.g. `teaspoon-worker`), set permission to **Sending access**
   - Copy the key — it is shown only once

4. **Add the key to Cloudflare**
   - Cloudflare dashboard → Workers & Pages → `teaspoon` → Settings → Environment variables
   - Add `RESEND_API_KEY` marked as **Encrypted**, paste the key from step 3

5. **Set the recipient address** (optional)
   - The recipient is configured via `CONTACT_EMAIL` in [wrangler.toml](wrangler.toml) (currently `radomir.cernoch@gmail.com`)
   - To change it without redeploying, override it as a plain (non-encrypted) environment variable in the Cloudflare dashboard

---

## GitHub Setup (Hosting)

GitHub is used as the source repository that Cloudflare Pages pulls from and deploys automatically on every push.

1. **Create a new repository** on [github.com](https://github.com) (can be private).

2. **Push this project**
   ```
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

3. **Connect to Cloudflare Pages** (see step 4 in Cloudflare Setup above) — select the repository you just created.

4. **Deploy on push** — every `git push` to `main` will automatically trigger a new Cloudflare Pages deployment. No additional CI configuration is needed.
