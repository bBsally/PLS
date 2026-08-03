export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Please enter a valid e-mail address." }, { status: 400 });
  }

  if (!env.RESEND_API_KEY) {
    return Response.json({ error: "The beta mailbox is not configured yet." }, { status: 503 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "User-Agent": "pls-beta-access/1.0" },
    body: JSON.stringify({
      from: env.FROM_EMAIL || "PL$ <onboarding@resend.dev>",
      to: ["bbsally389@gmail.com"],
      reply_to: email,
      subject: "New PL$ beta access request",
      text: `A visitor asked for PL$ beta access.\n\nTheir e-mail: ${email}`,
    }),
  });

  if (!response.ok) {
    return Response.json({ error: "Could not send your request. Please try again later." }, { status: 502 });
  }

  return Response.json({ message: "Request sent. I’ll get back to you soon." });
}
