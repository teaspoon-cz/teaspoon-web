// Cloudflare Pages Function — POST /api/submit
//
// Required bindings (configure in wrangler.toml + Cloudflare Pages dashboard):
//   DB                   — D1 database binding named "teaspoon-forms"
//   TURNSTILE_SECRET_KEY — encrypted environment variable (Cloudflare Turnstile secret)
//   ADMIN_PASSWORD       — encrypted environment variable (admin panel password)

export async function onRequestPost(context) {
  const { request, env } = context;

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid form data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. Honeypot check — silent accept to fool bots
  const honeypot = formData.get("web_site") || "";
  if (honeypot.trim() !== "") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Turnstile verification
  const turnstileToken = formData.get("cf-turnstile-response") || "";
  const tsVerifyRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v1/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(env.TURNSTILE_SECRET_KEY)}&response=${encodeURIComponent(turnstileToken)}`,
    }
  );
  const tsData = await tsVerifyRes.json();
  if (!tsData.success) {
    return new Response(JSON.stringify({ error: "Ověření se nezdařilo" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Parse fields
  const first_name = formData.get("first_name") || "";
  const last_name  = formData.get("last_name")  || "";
  const email      = formData.get("email")      || "";
  const phone      = formData.get("phone")      || "";
  const message    = formData.get("message")    || "";
  const form_name  = formData.get("_form")      || "contact";

  // Collect remaining fields into raw_data (exclude special/meta fields)
  const excludedKeys = new Set([
    "web_site",
    "cf-turnstile-response",
    "_form",
    "first_name",
    "last_name",
    "email",
    "phone",
    "message",
  ]);
  const rawObj = {};
  for (const [key, value] of formData.entries()) {
    if (!excludedKeys.has(key)) {
      rawObj[key] = value;
    }
  }
  const raw_data = JSON.stringify(rawObj);

  // 4. Insert into D1
  const submitted_at = new Date().toISOString();
  const ip_address   = request.headers.get("CF-Connecting-IP") || "";
  const user_agent   = request.headers.get("User-Agent") || "";

  try {
    await env.DB.prepare(
      `INSERT INTO submissions
         (submitted_at, form_name, first_name, last_name, email, phone, message, raw_data, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(submitted_at, form_name, first_name, last_name, email, phone, message, raw_data, ip_address, user_agent)
      .run();
  } catch (err) {
    console.error("D1 insert error:", err);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5. Send email via MailChannels
  const emailBody = {
    personalizations: [{ to: [{ email: "teaspooncz@gmail.com" }] }],
    from: { email: "noreply@teaspoon.cz", name: "Teaspoon web" },
    reply_to: { email: email },
    subject: "Nová zpráva z webu",
    content: [
      {
        type: "text/plain",
        value: `Jméno: ${first_name} ${last_name}\nEmail: ${email}\nTelefon: ${phone}\n\n${message}`,
      },
    ],
  };

  try {
    const mailRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailBody),
    });
    if (!mailRes.ok) {
      const errText = await mailRes.text();
      console.error("MailChannels error:", mailRes.status, errText);
    }
  } catch (err) {
    console.error("MailChannels fetch error:", err);
  }

  // 6. Return success
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
