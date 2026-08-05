export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    // Check secret
    if (data.secret !== env.AGENT_SECRET) {
      return Response.json({ error: "Wrong secret. Got: " + data.secret }, { status: 401 });
    }

    // Save to KV
    try {
      if (env.PLS_DB) {
        await env.PLS_DB.put("current-status", JSON.stringify({
          status: data.status || "offline",
          activity: data.activity || "chilling",
          category: data.category || "idle",
          window: data.window || "",
          updated: new Date().toISOString()
        }));
        return Response.json({ success: true, saved: data.activity });
      } else {
        return Response.json({ error: "KV not bound" }, { status: 500 });
      }
    } catch (kvErr) {
      return Response.json({ error: "KV error: " + kvErr.message }, { status: 500 });
    }
  } catch (e) {
    return Response.json({ error: "Invalid request: " + e.message }, { status: 400 });
  }
}

// Also handle GET for testing
export async function onRequestGet({ request, env }) {
  return Response.json({ message: "status endpoint works. Use POST to update." });
}