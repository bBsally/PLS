export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    // TEMPORARY: no secret check for testing
    console.log("Received activity:", data.activity);

    if (env.PLS_DB) {
      await env.PLS_DB.put("current-status", JSON.stringify({
        status: data.status || "offline",
        activity: data.activity || "chilling",
        category: data.category || "idle",
        window: data.window || "",
        updated: new Date().toISOString()
      }));
      return Response.json({ success: true, saved: data.activity });
    }
    return Response.json({ error: "KV not bound" }, { status: 500 });
  } catch (e) {
    return Response.json({ error: "Error: " + e.message }, { status: 400 });
  }
}

export async function onRequestGet({ request, env }) {
  try {
    if (env.PLS_DB) {
      const raw = await env.PLS_DB.get("current-status");
      if (raw) {
        return new Response(raw, {
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
        });
      }
    }
    return Response.json({ status: "offline", activity: "chilling", category: "idle" });
  } catch (e) {
    return Response.json({ error: "KV error: " + e.message }, { status: 500 });
  }
}