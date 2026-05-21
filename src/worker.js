// Required bindings (wrangler.toml + Cloudflare dashboard secrets):
//   DB                   — D1 database named "teaspoon-forms"
//   ASSETS               — static assets binding (auto-configured via [assets] in wrangler.toml)
//   HCAPTCHA_SECRET_KEY  — encrypted env var
//   ADMIN_PASSWORD       — encrypted env var
//   RESEND_API_KEY       — encrypted env var (https://resend.com)

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "POST" && url.pathname === "/api/submit") {
        return await handleSubmit(request, env);
      }

      if (request.method === "GET" && url.pathname === "/api/entries") {
        return await handleEntries(request, env);
      }

      if (request.method === "POST" && url.pathname === "/api/hide") {
        return await handleHide(request, env);
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
  const message        = formData.get("message") || formData.get("notes") || "";
  const street         = formData.get("street")         || "";
  const city           = formData.get("city")           || "";
  const postal_code    = formData.get("postal_code")    || "";
  const club_selection = formData.get("club_selection") || "";
  const form_name      = formData.get("_form")          || "contact";

  const excluded = new Set(["web_site", "h-captcha-response", "_form", "first_name", "last_name", "email", "phone", "message", "notes", "street", "city", "postal_code", "club_selection"]);
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
      `INSERT INTO submissions (submitted_at, form_name, first_name, last_name, email, phone, message, street, city, postal_code, club_selection, raw_data, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(submitted_at, form_name, first_name, last_name, email, phone, message, street, city, postal_code, club_selection, JSON.stringify(rawObj), ip_address, user_agent).run();
  } catch (err) {
    console.error("D1 insert error:", err);
    return jsonResponse({ error: "Database error" }, 500);
  }

  // 5. Email via Resend
  try {
    const mailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Teaspoon web <noreply@teaspoon.cz>",
        to: [env.CONTACT_EMAIL],
        reply_to: email,
        subject: `Nový formulář: ${form_name}`,
        text: buildEmailText({ submitted_at, form_name, first_name, last_name, email, phone, message, street, city, postal_code, club_selection }),
        html: buildEmailHtml({ submitted_at, form_name, first_name, last_name, email, phone, message, street, city, postal_code, club_selection }),
      }),
    });
    if (!mailRes.ok) console.error("Resend error:", mailRes.status, await mailRes.text());
  } catch (err) {
    console.error("Resend fetch error:", err);
  }

  return jsonResponse({ ok: true }, 200);
}

// ---------------------------------------------------------------------------
// GET /api/entries?password=XXX[&page=N]
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

  const pageSize = Math.max(1, parseInt(env.ENTRIES_PAGE_SIZE || "100", 10) || 100);

  let totalCount = 0;
  try {
    const countResult = await env.DB.prepare("SELECT COUNT(*) AS cnt FROM submissions WHERE hidden = 0").first();
    totalCount = countResult?.cnt ?? 0;
  } catch (err) {
    console.error("D1 count error:", err);
    return new Response("Database error", { status: 500 });
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const rawPage = url.searchParams.get("page");
  let page;
  if (rawPage === null) {
    page = 1;
  } else {
    const parsed = parseInt(rawPage, 10);
    if (isNaN(parsed) || parsed < 1) page = 1;
    else if (parsed > totalPages) page = totalPages;
    else page = parsed;
  }

  if (rawPage !== null && String(page) !== rawPage) {
    const redirectUrl = new URL(request.url);
    redirectUrl.searchParams.set("page", page);
    return Response.redirect(redirectUrl.toString(), 302);
  }

  const offset = (page - 1) * pageSize;

  let rows = [];
  try {
    const result = await env.DB.prepare(
      "SELECT * FROM submissions WHERE hidden = 0 ORDER BY submitted_at DESC LIMIT ? OFFSET ?"
    ).bind(pageSize, offset).all();
    rows = result.results || [];
  } catch (err) {
    console.error("D1 query error:", err);
    return new Response("Database error", { status: 500 });
  }

  const tableRows = [];
  const compactCards = [];
  rows.forEach((row) => {
    const kontakt = [
      [esc(row.first_name), esc(row.last_name)].filter(Boolean).join(' '),
      esc(row.street),
      [esc(row.city), esc(row.postal_code)].filter(Boolean).join(' '),
      esc(row.email),
      esc(row.phone),
    ].filter(Boolean).join('<br>');
    tableRows.push(`<tr>
      <td><input type="checkbox" class="row-cb" data-id="${row.id}" onchange="onCbChange(this)">${row.id}</td>
      <td>${esc(formatPrague(row.submitted_at))}</td>
      <td>${esc(row.form_name)}</td>
      <td>${kontakt}</td>
      <td style="max-width:220px;white-space:pre-wrap">${esc(row.message)}</td>
      <td>${esc(row.club_selection)}</td>
    </tr>`);
    compactCards.push(
      `<div class="cc">`
      + `<div class="cc-hd"><label><input type="checkbox" class="row-cb" data-id="${row.id}" onchange="onCbChange(this)"><strong>#${row.id}</strong></label> ${esc(formatPrague(row.submitted_at))}</div>`
      + `<div><em>Formulář:</em> ${esc(row.form_name)}</div>`
      + (row.club_selection ? `<div><em>Klub:</em> ${esc(row.club_selection)}</div>` : '')
      + `<div><em>Kontakt:</em><div class="cc-indent">${kontakt}</div></div>`
      + (row.message ? `<div><em>Zpráva:</em><div class="cc-indent cc-msg">${esc(row.message)}</div></div>` : '')
      + `</div>`
    );
  });
  const tableRowsHtml = tableRows.join("\n");
  const compactCardsHtml = compactCards.join("\n");

  const paginationHtml = buildPagination(page, totalPages, url);
  const jumpForm = `<form method="get" action="/api/entries" class="pg-jump">
  <input type="hidden" name="password" value="${esc(provided)}">
  <label>Přejít na stránku: <input type="number" name="page" min="1" max="${totalPages}" value="${page}"></label>
  <button type="submit">Přejít</button>
</form>`;

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
.meta{display:flex;justify-content:space-between;align-items:center;color:#666;margin-bottom:.75rem;font-size:.8rem}
.wrap{overflow-x:auto}
table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #ddd;border-radius:6px;overflow:hidden}
th{background:#3e3f75;color:#fff;padding:.6rem .75rem;text-align:left;font-weight:600;white-space:nowrap}
td{padding:.55rem .75rem;border-top:1px solid #eee;vertical-align:top}
tr:hover td{background:#f0f4ff}
details summary{cursor:pointer;color:#3e3f75;font-size:.78rem}
details summary:hover{text-decoration:underline}
.empty{text-align:center;color:#888;padding:2rem}
.pg{display:flex;flex-wrap:wrap;gap:.3rem;align-items:center;padding:.5rem 0;font-size:.82rem;margin:.25rem 0}
.pg a{color:#3e3f75;text-decoration:none;padding:.2rem .45rem;border:1px solid #c5c6e8;border-radius:3px;background:#fff}
.pg a:hover{background:#eef}
.pg-cur{padding:.2rem .45rem;background:#3e3f75;color:#fff;border-radius:3px;font-weight:600;border:1px solid #3e3f75}
.pg-dots{color:#999;padding:.2rem .15rem}
.pg-off{color:#ccc;padding:.2rem .45rem}
.pg-bottom-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;margin-top:.25rem}
.pg-jump{display:flex;align-items:center;gap:.4rem;font-size:.82rem}
.pg-jump label{white-space:nowrap}
.pg-jump input[type=number]{width:5.5em;padding:.25rem .4rem;border:1px solid #ccc;border-radius:3px;font-size:.82rem}
.pg-jump button{padding:.25rem .75rem;background:#3e3f75;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:.82rem}
.pg-jump button:hover{background:#2e2f60}
tr:nth-child(even) td{background:#f5f5fa}
.compact{display:none}
.cc{background:#fff;padding:.75rem;border-bottom:1px solid #eee}
.cc:nth-child(even){background:#f5f5fa}
.cc-hd{margin-bottom:.35rem}
.cc>div{margin:.2rem 0}
.cc em{color:#555}
.cc-indent{padding-left:1em}
.cc-msg{white-space:pre-wrap}
.trash-btn{background:none;border:1px solid #d9a0a0;color:#af1b1d;border-radius:3px;padding:.25rem .45rem;cursor:pointer;display:flex;align-items:center;gap:.3rem;font-size:.78rem;line-height:1}
.trash-btn:hover:not(:disabled){background:#fbeaea;border-color:#af1b1d}
.trash-btn:disabled{color:#ccc;border-color:#e0d0d0;cursor:default}
.row-cb{accent-color:#af1b1d;cursor:pointer;margin-right:.35rem;vertical-align:middle}
tr.selected td{background:#fbeaea !important}
tr.selected:hover td{background:#f5d8d8 !important}
.cc.selected{background:#fbeaea !important}
@media(max-width:600px){.wrap{display:none}.compact{display:block}}
</style>
</head>
<body>
<h1>Přijaté zprávy</h1>
<div class="meta"><span>Celkem: <strong>${totalCount}</strong> záznamů &nbsp;·&nbsp; Stránka <strong>${page}</strong> z <strong>${totalPages}</strong> &nbsp;·&nbsp; ${pageSize} na stránku</span><button id="hide-btn" class="trash-btn" onclick="hideSelected()" disabled title="Skrýt vybrané záznamy"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Skrýt vybrané</button></div>
${paginationHtml}
<div class="wrap"><table>
<thead><tr><th>#</th><th>Datum</th><th>Formulář</th><th>Kontakt</th><th>Zpráva</th><th>Klub</th></tr></thead>
<tbody>${rows.length > 0 ? tableRowsHtml : '<tr><td colspan="6" class="empty">Žádné záznamy.</td></tr>'}</tbody>
</table></div>
<div class="compact">${rows.length > 0 ? compactCardsHtml : '<div class="empty">Žádné záznamy.</div>'}</div>
<div class="pg-bottom-bar">
  ${paginationHtml}
  ${jumpForm}
</div>
<script>
const _pw=${JSON.stringify(provided).replace(/<\//g, '<\\/')};
function onCbChange(cb){
  const row=cb.closest('tr')||cb.closest('.cc');
  if(row)row.classList.toggle('selected',cb.checked);
  document.getElementById('hide-btn').disabled=!document.querySelector('.row-cb:checked');
}
async function hideSelected(){
  const cbs=Array.from(document.querySelectorAll('.row-cb:checked'));
  if(!cbs.length)return;
  const n=cbs.length;
  if(!confirm('Opravdu skrýt '+(n===1?'1 záznam':n<5?n+' záznamy':n+' záznamů')+'?'))return;
  const btn=document.getElementById('hide-btn');
  btn.disabled=true;
  try{
    const r=await fetch('/api/hide',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'password='+encodeURIComponent(_pw)+'&ids='+encodeURIComponent(cbs.map(c=>c.dataset.id).join(','))});
    if(r.ok){cbs.forEach(c=>{const el=c.closest('tr')||c.closest('.cc');if(el)el.remove();});}
    else{alert('Chyba při skrývání záznamů.');btn.disabled=false;}
  }catch{alert('Chyba sítě.');btn.disabled=false;}
}
</script>
</body></html>`;

  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// ---------------------------------------------------------------------------
// POST /api/hide
// ---------------------------------------------------------------------------

async function handleHide(request, env) {
  let body;
  try { body = await request.formData(); } catch {
    return jsonResponse({ error: "Invalid form data" }, 400);
  }
  const provided = body.get("password") || "";
  const enc = new TextEncoder();
  const a = enc.encode(provided);
  const b = enc.encode(env.ADMIN_PASSWORD || "");
  let authorized = false;
  if (a.length === b.length) {
    try { authorized = await crypto.subtle.timingSafeEqual(a, b); } catch {}
  }
  if (!authorized) return jsonResponse({ error: "Unauthorized" }, 401);

  const rawIds = (body.get("ids") || "")
    .split(",")
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && n >= 1);
  if (!rawIds.length) return jsonResponse({ error: "No valid ids" }, 400);

  try {
    const placeholders = rawIds.map(() => "?").join(",");
    await env.DB.prepare(`UPDATE submissions SET hidden = 1 WHERE id IN (${placeholders})`).bind(...rawIds).run();
  } catch (err) {
    console.error("D1 hide error:", err);
    return jsonResponse({ error: "Database error" }, 500);
  }
  return jsonResponse({ ok: true }, 200);
}

function buildPagination(page, totalPages, url) {
  if (totalPages <= 1) return '';

  const pageHref = (p) => {
    const u = new URL(url);
    u.searchParams.set("page", p);
    return esc(u.toString());
  };
  const link = (p, label) => `<a href="${pageHref(p)}">${label ?? p}</a>`;

  const parts = [];

  if (page > 1) parts.push(link(page - 1, '&lt;&nbsp;prev'));
  else parts.push('<span class="pg-off">&lt;&nbsp;prev</span>');

  const wStart = Math.max(1, page - 10);
  const wEnd   = Math.min(totalPages, page + 10);

  if (wStart > 1) parts.push('<span class="pg-dots">…</span>');

  for (let p = wStart; p <= wEnd; p++) {
    if (p === page) parts.push(`<span class="pg-cur">${p}</span>`);
    else parts.push(link(p));
  }

  if (wEnd < totalPages) parts.push('<span class="pg-dots">…</span>');

  if (page < totalPages) parts.push(link(page + 1, 'next&nbsp;&gt;'));
  else parts.push('<span class="pg-off">next&nbsp;&gt;</span>');

  return `<nav class="pg">${parts.join(' ')}</nav>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emailKontakt({ first_name, last_name, street, city, postal_code, email, phone }) {
  return [
    [first_name, last_name].filter(Boolean).join(' '),
    street,
    [city, postal_code].filter(Boolean).join(' '),
    email,
    phone,
  ].filter(Boolean);
}

function buildEmailText({ submitted_at, form_name, first_name, last_name, email, phone, message, street, city, postal_code, club_selection }) {
  const lines = [formatPrague(submitted_at), ''];
  lines.push(`Formulář: ${form_name}`);
  if (club_selection) lines.push(`Klub: ${club_selection}`);
  lines.push('', 'Kontakt:');
  emailKontakt({ first_name, last_name, street, city, postal_code, email, phone }).forEach(l => lines.push(`  ${l}`));
  if (message) {
    lines.push('', 'Zpráva:');
    message.split('\n').forEach(l => lines.push(`  ${l}`));
  }
  return lines.join('\n');
}

function buildEmailHtml({ submitted_at, form_name, first_name, last_name, email, phone, message, street, city, postal_code, club_selection }) {
  const kontakt = emailKontakt({ first_name, last_name, street, city, postal_code, email, phone }).map(esc).join('<br>');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;font-size:.875rem;color:#222;max-width:560px;margin:0 auto;padding:1rem">
<div style="background:#fff;padding:.75rem;border:1px solid #eee;border-radius:6px">
  <div style="margin-bottom:.35rem"><strong>${esc(formatPrague(submitted_at))}</strong></div>
  <div><em style="color:#555">Formulář:</em> ${esc(form_name)}</div>
  ${club_selection ? `<div><em style="color:#555">Klub:</em> ${esc(club_selection)}</div>` : ''}
  <div><em style="color:#555">Kontakt:</em><div style="padding-left:1em">${kontakt}</div></div>
  ${message ? `<div><em style="color:#555">Zpráva:</em><div style="padding-left:1em;white-space:pre-wrap">${esc(message)}</div></div>` : ''}
</div>
</body></html>`;
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function formatPrague(isoStr) {
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('sv', {
      timeZone: 'Europe/Prague',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).formatToParts(d).map(({ type, value }) => [type, value])
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
