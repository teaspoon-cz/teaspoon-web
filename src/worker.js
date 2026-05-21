// Required bindings (wrangler.toml + Cloudflare dashboard secrets):
//   DB                   — D1 database named "teaspoon-forms"
//   ASSETS               — static assets binding (auto-configured via [assets] in wrangler.toml)
//   HCAPTCHA_SECRET_KEY  — encrypted env var
//   ADMIN_PASSWORD       — encrypted env var

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "POST" && url.pathname === "/api/submit") {
        return await handleSubmit(request, env);
      }

      if (request.method === "GET" && url.pathname === "/api/formular/entries") {
        return await handleEntries(request, env);
      }

      return env.ASSETS.fetch(request);
    } catch (err) {
      console.error("Unhandled Worker exception:", err?.message, err?.stack);
      return jsonResponse({ error: "Internal server error", detail: err?.message }, 500);
    }
  },
};

// ---------------------------------------------------------------------------
// POST /api/submit
// ---------------------------------------------------------------------------

async function handleSubmit(request, env) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ error: "Invalid form data" }, 400);
  }

  // 1. Honeypot
  if ((formData.get("web_site") || "").trim() !== "") {
    return jsonResponse({ ok: true }, 200);
  }

  // 2. hCaptcha
  const hcaptchaToken = formData.get("h-captcha-response") || "";
  if (!env.HCAPTCHA_SECRET_KEY) {
    console.error("hCaptcha: HCAPTCHA_SECRET_KEY is not set");
    return jsonResponse({ error: "Configuration error" }, 500);
  }
  let hcData;
  try {
    const hcParams = new URLSearchParams({ secret: env.HCAPTCHA_SECRET_KEY, response: hcaptchaToken });
    const hcRes = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: hcParams.toString(),
    });
    const hcText = await hcRes.text();
    console.log("hCaptcha:", hcRes.status, hcText.substring(0, 200));
    if (!hcRes.ok) {
      return jsonResponse({ error: "Chyba ověření" }, 500);
    }
    hcData = JSON.parse(hcText);
  } catch (err) {
    console.error("hCaptcha error:", err?.message);
    return jsonResponse({ error: "Chyba ověření" }, 500);
  }
  if (!hcData?.success) {
    console.error("hCaptcha rejected:", JSON.stringify(hcData?.["error-codes"]));
    return jsonResponse({ error: "Ověření se nezdařilo" }, 400);
  }

  // 3. Parse fields
  const first_name     = formData.get("first_name")     || "";
  const last_name      = formData.get("last_name")      || "";
  const email          = formData.get("email")          || "";
  const phone          = formData.get("phone")          || "";
  const message        = formData.get("message")        || "";
  const street         = formData.get("street")         || "";
  const city           = formData.get("city")           || "";
  const postal_code    = formData.get("postal_code")    || "";
  const notes          = formData.get("notes")          || "";
  const club_selection = formData.get("club_selection") || "";
  const form_name      = formData.get("_form")          || "contact";

  const excluded = new Set(["web_site", "h-captcha-response", "_form", "first_name", "last_name", "email", "phone", "message", "street", "city", "postal_code", "notes", "club_selection"]);
  const rawObj = {};
  for (const [k, v] of formData.entries()) {
    if (!excluded.has(k)) rawObj[k] = v;
  }

  // 4. Save to D1
  const submitted_at = new Date().toISOString();
  const ip_address   = request.headers.get("CF-Connecting-IP") || "";
  const user_agent   = request.headers.get("User-Agent") || "";

  try {
    await env.DB.prepare(
      `INSERT INTO submissions (submitted_at, form_name, first_name, last_name, email, phone, message, street, city, postal_code, notes, club_selection, raw_data, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(submitted_at, form_name, first_name, last_name, email, phone, message, street, city, postal_code, notes, club_selection, JSON.stringify(rawObj), ip_address, user_agent).run();
  } catch (err) {
    console.error("D1 insert error:", err);
    return jsonResponse({ error: "Database error" }, 500);
  }

  // 5. Email via MailChannels
  try {
    const mailRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: "radomir.cernoch@gmail.com" }] }],
        from: { email: "noreply@teaspoon.cz", name: "Teaspoon web" },
        reply_to: { email },
        subject: `Nový formulář: ${form_name}`,
        content: [{ type: "text/plain", value: buildEmailBody({ form_name, first_name, last_name, email, phone, message, street, city, postal_code, notes, club_selection }) }],
      }),
    });
    if (!mailRes.ok) console.error("MailChannels error:", mailRes.status, await mailRes.text());
  } catch (err) {
    console.error("MailChannels fetch error:", err);
  }

  return jsonResponse({ ok: true }, 200);
}

// ---------------------------------------------------------------------------
// GET /api/formular/entries?password=XXX
// ---------------------------------------------------------------------------

async function handleEntries(request, env) {
  const url = new URL(request.url);
  const provided = url.searchParams.get("password") || "";

  const enc = new TextEncoder();
  const a = enc.encode(provided);
  const b = enc.encode(env.ADMIN_PASSWORD || "");

  let authorized = false;
  if (a.length === b.length) {
    try { authorized = await crypto.subtle.timingSafeEqual(a, b); } catch {}
  }
  if (!authorized) return jsonResponse({ error: "Unauthorized" }, 401);

  let rows = [];
  try {
    const result = await env.DB.prepare(
      "SELECT * FROM submissions ORDER BY submitted_at DESC LIMIT 200"
    ).all();
    rows = result.results || [];
  } catch (err) {
    console.error("D1 query error:", err);
    return new Response("Database error", { status: 500 });
  }

  const tableRows = rows.map((row, idx) => {
    const rawFormatted = (() => {
      try { return JSON.stringify(JSON.parse(row.raw_data || "{}"), null, 2); }
      catch { return row.raw_data || ""; }
    })();
    return `<tr>
      <td>${rows.length - idx}</td>
      <td>${esc(row.submitted_at)}</td>
      <td>${esc(row.form_name)}</td>
      <td>${esc(row.first_name)}</td>
      <td>${esc(row.last_name)}</td>
      <td>${esc(row.email)}</td>
      <td>${esc(row.phone)}</td>
      <td style="max-width:220px;white-space:pre-wrap">${esc(row.message)}</td>
      <td>${esc(row.street)}</td>
      <td>${esc(row.city)}</td>
      <td>${esc(row.postal_code)}</td>
      <td style="max-width:180px;white-space:pre-wrap">${esc(row.notes)}</td>
      <td>${esc(row.club_selection)}</td>
      <td>${esc(row.ip_address)}</td>
      <td><details><summary>raw</summary><pre style="font-size:.75rem;background:#f5f5f5;padding:.5em;border-radius:4px;overflow:auto;max-width:400px">${esc(rawFormatted)}</pre></details></td>
    </tr>`;
  }).join("\n");

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Přijaté zprávy – Teaspoon</title>
<style>
*,*::before,*::after{box-sizing:border-box}
body{font-family:system-ui,sans-serif;font-size:.875rem;margin:0;padding:1.5rem;background:#fafafa;color:#222}
h1{margin:0 0 .5rem;font-size:1.4rem}
.meta{color:#666;margin-bottom:1.5rem;font-size:.8rem}
.wrap{overflow-x:auto}
table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #ddd;border-radius:6px;overflow:hidden}
th{background:#3e3f75;color:#fff;padding:.6rem .75rem;text-align:left;font-weight:600;white-space:nowrap}
td{padding:.55rem .75rem;border-top:1px solid #eee;vertical-align:top}
tr:hover td{background:#f0f4ff}
details summary{cursor:pointer;color:#3e3f75;font-size:.78rem}
details summary:hover{text-decoration:underline}
.empty{text-align:center;color:#888;padding:2rem}
</style>
</head>
<body>
<h1>Přijaté zprávy</h1>
<p class="meta">Celkem: <strong>${rows.length}</strong> (max. 200, od nejnovějšího)</p>
<div class="wrap"><table>
<thead><tr><th>#</th><th>Datum</th><th>Formulář</th><th>Jméno</th><th>Příjmení</th><th>Email</th><th>Telefon</th><th>Zpráva</th><th>Ulice</th><th>Město</th><th>PSČ</th><th>Poznámka</th><th>Klub</th><th>IP</th><th>Data</th></tr></thead>
<tbody>${rows.length > 0 ? tableRows : '<tr><td colspan="15" class="empty">Žádné záznamy.</td></tr>'}</tbody>
</table></div>
</body></html>`;

  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEmailBody({ form_name, first_name, last_name, email, phone, message, street, city, postal_code, notes, club_selection }) {
  const lines = [
    `Formulář: ${form_name}`,
    `Jméno: ${first_name} ${last_name}`,
    `Email: ${email}`,
    `Telefon: ${phone}`,
  ];
  if (club_selection) lines.push(`Klub: ${club_selection}`);
  if (street)         lines.push(`Ulice: ${street}`);
  if (city)           lines.push(`Město: ${city}`);
  if (postal_code)    lines.push(`PSČ: ${postal_code}`);
  if (message)        lines.push(``, `Zpráva:`, message);
  if (notes)          lines.push(``, `Poznámka:`, notes);
  return lines.join("\n");
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
