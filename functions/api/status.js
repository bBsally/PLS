export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    if (data.secret !== env.AGENT_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  return Response.json({ message: "status endpoint works. Use POST." });
}