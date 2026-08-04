export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();
  const type = String(formData.get("type") || "beta").trim();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Please enter a valid e-mail address." }, { status: 400 });
  }

  let count = "?";

  // Save to KV and increment counter
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

  // Send email via Resend (only for beta requests)
  if (type === "beta") {
    if (!env.RESEND_API_KEY) {
      return Response.json({ error: "The beta mailbox is not configured yet." }, { status: 503 });
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "pls-beta-access/1.0"
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "PL$ <hello@yourdomain.com>",
        to: ["bbsally389@gmail.com"],
        reply_to: email,
        subject: "New PL$ beta access request",
        text: `A visitor asked for PL$ beta access.\n\nTheir e-mail: ${email}`,
      }),
    });
    if (!response.ok) {
      return Response.json({ error: "Could not send your request. Please try again later." }, { status: 502 });
    }
  }

  const msg = type === "beta"
    ? "Request sent. I'll get back to you soon."
    : "Subscribed! You'll be notified at launch.";

  return Response.json({ message: msg, count });
}
