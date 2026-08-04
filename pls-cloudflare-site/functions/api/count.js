export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "beta";

  let count = 0;
  if (env.PLS_DB) {
    const countKey = `${type}-count`;
    const val = await env.PLS_DB.get(countKey);
    count = val ? parseInt(val) : 0;
  }

  return new Response(JSON.stringify({ count }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache"
    }
  });
}