# Cloudflare Setup Checklist

1. **Create D1 database**
   - In Cloudflare dashboard → Workers & Pages → D1 → Create database
   - Name: `teaspoon-forms`
   - Copy the database ID and paste it into `wrangler.toml` replacing `REPLACE_WITH_D1_DATABASE_ID`

2. **Apply database schema**
   ```
   npx wrangler d1 execute teaspoon-forms --file=schema.sql
   ```

3. **Create Turnstile widget**
   - Cloudflare dashboard → Turnstile → Add widget
   - Type: Managed
   - Domain: `teaspoon.cz`
   - Copy the **Site Key** and replace `TURNSTILE_SITE_KEY_PLACEHOLDER` in `web/kontakt/index.html`

4. **Set encrypted environment variables**
   - Cloudflare Pages → your project → Settings → Environment variables
   - Add (mark as **Encrypted**):
     - `TURNSTILE_SECRET_KEY` — the Turnstile Secret Key from step 3
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
