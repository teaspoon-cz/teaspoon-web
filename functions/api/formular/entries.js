// Cloudflare Pages Function — GET /api/admin/entries?password=XXX
//
// Required bindings (configure in wrangler.toml + Cloudflare Pages dashboard):
//   DB             — D1 database binding named "teaspoon-forms"
//   ADMIN_PASSWORD — encrypted environment variable

export async function onRequestGet(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const providedPassword = url.searchParams.get("password") || "";

  // Timing-safe password comparison
  const encoder = new TextEncoder();
  const a = encoder.encode(providedPassword);
  const b = encoder.encode(env.ADMIN_PASSWORD || "");

  let authorized = false;
  if (a.length === b.length) {
    try {
      authorized = await crypto.subtle.timingSafeEqual(a, b);
    } catch {
      authorized = false;
    }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Query submissions
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

  // Build HTML rows
  const tableRows = rows
    .map((row, idx) => {
      const rawFormatted = (() => {
        try {
          return JSON.stringify(JSON.parse(row.raw_data || "{}"), null, 2);
        } catch {
          return row.raw_data || "";
        }
      })();
      return `
    <tr>
      <td>${rows.length - idx}</td>
      <td>${escHtml(row.submitted_at || "")}</td>
      <td>${escHtml(row.form_name || "")}</td>
      <td>${escHtml(row.first_name || "")}</td>
      <td>${escHtml(row.last_name || "")}</td>
      <td>${escHtml(row.email || "")}</td>
      <td>${escHtml(row.phone || "")}</td>
      <td style="max-width:300px;white-space:pre-wrap;">${escHtml(row.message || "")}</td>
      <td>${escHtml(row.ip_address || "")}</td>
      <td>
        <details>
          <summary>raw</summary>
          <pre style="font-size:0.75rem;background:#f5f5f5;padding:0.5em;border-radius:4px;overflow:auto;max-width:400px;">${escHtml(rawFormatted)}</pre>
        </details>
      </td>
    </tr>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Přijaté zprávy – Teaspoon</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: system-ui, sans-serif;
    font-size: 0.875rem;
    margin: 0;
    padding: 1.5rem;
    background: #fafafa;
    color: #222;
  }
  h1 { margin: 0 0 1rem; font-size: 1.4rem; }
  .meta { color: #666; margin-bottom: 1.5rem; font-size: 0.8rem; }
  .table-wrap { overflow-x: auto; }
  table {
    border-collapse: collapse;
    width: 100%;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 6px;
    overflow: hidden;
  }
  th {
    background: #3e3f75;
    color: #fff;
    padding: 0.6rem 0.75rem;
    text-align: left;
    font-weight: 600;
    white-space: nowrap;
  }
  td {
    padding: 0.55rem 0.75rem;
    border-top: 1px solid #eee;
    vertical-align: top;
  }
  tr:hover td { background: #f0f4ff; }
  details summary {
    cursor: pointer;
    color: #3e3f75;
    font-size: 0.78rem;
  }
  details summary:hover { text-decoration: underline; }
  .empty { text-align: center; color: #888; padding: 2rem; }
</style>
</head>
<body>
<h1>Přijaté zprávy</h1>
<p class="meta">Celkem záznamů: <strong>${rows.length}</strong> (zobrazeno max. 200, seřazeno od nejnovějšího)</p>
<div class="table-wrap">
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Datum</th>
      <th>Formulář</th>
      <th>Jméno</th>
      <th>Příjmení</th>
      <th>Email</th>
      <th>Telefon</th>
      <th>Zpráva</th>
      <th>IP</th>
      <th>Data</th>
    </tr>
  </thead>
  <tbody>
    ${rows.length > 0 ? tableRows : '<tr><td colspan="10" class="empty">Žádné záznamy.</td></tr>'}
  </tbody>
</table>
</div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
