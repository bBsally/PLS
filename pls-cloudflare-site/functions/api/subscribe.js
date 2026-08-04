export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();
  const type = String(formData.get("type") || "beta").trim();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Please enter a valid e-mail address." }, { status: 400 });
  }

  let count = "?";

  // Save to KV and increment counter
  try {
    if (env.PLS_DB) {
      const key = `${type}:${email.toLowerCase()}`;
      const existing = await env.PLS_DB.get(key);
      if (!existing) {
        await env.PLS_DB.put(key, JSON.stringify({ date: new Date().toISOString() }));
        const countKey = `${type}-count`;
        const current = parseInt(await env.PLS_DB.get(countKey) || "0");
        const next = current + 1;
        await env.PLS_DB.put(countKey, String(next));
        count = String(next);
      } else {
        const countKey = `${type}-count`;
        count = await env.PLS_DB.get(countKey) || "?";
      }
    }
  } catch (e) {
    console.error("KV error:", e);
  }

  // Send email via Resend (only for beta requests)
  if (type === "beta") {
    if (!env.RESEND_API_KEY) {
      return Response.json({ error: "RESEND_API_KEY not set in Cloudflare environment variables." }, { status: 503 });
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "pls-beta-access/1.0"
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "onboarding@resend.dev",
        to: ["bbsally389@gmail.com"],
        reply_to: email,
        subject: "New PL$ beta access request",
        text: `A visitor asked for PL$ beta access.\n\nTheir e-mail: ${email}`,
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      return Response.json({ error: `Resend error: ${response.status} — ${errText}` }, { status: 502 });
    }
  }

  const msg = type === "beta"
    ? "Request sent. I'll get back to you soon."
    : "Subscribed! You'll be notified at launch.";

  return Response.json({ message: msg, count });
}