# Teaspoon

Teaspoon is a static website for [teaspoon.cz](https://teaspoon.cz).

It is hosted on Cloudflare Pages. A Cloudflare Worker backs the contact form: it validates submissions with hCaptcha, stores them in a Cloudflare D1 database, and forwards them by email via MailChannels. An optional password-protected admin view at `/formular/` lists all received submissions.

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
     - `ADMIN_PASSWORD` — a strong password for the `/formular/` admin view

4. **Connect the repository in Cloudflare Pages**
   - Cloudflare dashboard → Workers & Pages → Create application → Pages → Connect to Git
   - Select this repository
   - Build settings:
     - Build command: *(leave empty)*
     - Build output directory: `web`
   - Save and deploy

5. **Test**
   - Visit `/kontakt/` and submit the contact form; verify the success message appears
   - Visit `/formular/`, enter the admin password, and confirm the submission shows in the table

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
