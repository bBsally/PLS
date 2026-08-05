export async function onRequestGet({ request, env }) {
  let data = { status: "offline", activity: "chilling", category: "idle", window: "" };
  try {
    if (env.PLS_DB) {
      const raw = await env.PLS_DB.get("current-status");
      if (raw) data = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Status read error:", e);
  }
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache"
    }
  });
}