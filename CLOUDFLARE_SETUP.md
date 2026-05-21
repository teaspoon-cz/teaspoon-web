# Cloudflare Setup Checklist

1. **Create D1 database**
   - In Cloudflare dashboard → Workers & Pages → D1 → Create database
   - Name: `teaspoon-forms`
   - Copy the database ID and paste it into `wrangler.toml` replacing `REPLACE_WITH_D1_DATABASE_ID`

2. **Apply database schema**
   ```
   npx wrangler d1 execute teaspoon-forms --file=schema.sql
   ```

3. **Create hCaptcha widget**
   - Register at hcaptcha.com → Add New Site
   - Domain: `teaspoon.cz` (and `test.teaspoon.cz` for testing)
   - Copy the **Site Key** and replace `HCAPTCHA_SITE_KEY_PLACEHOLDER` in `web/kontakt/index.html`

4. **Set encrypted environment variables**
   - Cloudflare dashboard → Workers & Pages → `teaspoon` → Settings → Environment variables
   - Add (mark as **Encrypted**):
     - `HCAPTCHA_SECRET_KEY` — the hCaptcha Secret Key from step 3
     - `ADMIN_PASSWORD` — choose a strong password for `/formular/`

5. **Connect repository in Cloudflare Pages**
   - Cloudflare dashboard → Workers & Pages → Create application → Pages → Connect to Git
   - Select this repository
   - Build settings:
     - Build command: *(leave empty)*
     - Build output directory: `web`
   - Save and deploy

6. **Test**
   - Visit `/kontakt/` and submit the contact form; check for success message
   - Visit `/formular/`, enter the password, and verify the submission appears in the table
