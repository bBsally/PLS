export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    // TEMPORARY: log what we received for debugging
    console.log("Received:", JSON.stringify(data));
    console.log("Secret received:", data.secret);
    console.log("Expected secret starts with:", env.AGENT_SECRET ? env.AGENT_SECRET.substring(0,5) : "NOT SET");

    // Save to KV regardless (for testing)
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
  } catch (e) {
    return Response.json({ error: "Invalid request: " + e.message }, { status: 400 });
  }
}

export async function onRequestGet({ request, env }) {
  return Response.json({ 
    message: "status endpoint works",
    secret_set: !!env.AGENT_SECRET,
    secret_preview: env.AGENT_SECRET ? env.AGENT_SECRET.substring(0,5) + "..." : "NOT SET"
  });
}