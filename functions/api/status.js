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
    }
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}