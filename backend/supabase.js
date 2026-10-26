const { createClient } = require("@supabase/supabase-js");

function getSupabaseConfig(env = process.env) {
  const { SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key } = env;

  if (!url || !key) {
    return null;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL must be a valid URL");
  }

  const isLocalHttp = parsedUrl.protocol === "http:" && parsedUrl.hostname === "localhost";
  if (parsedUrl.protocol !== "https:" && !isLocalHttp) {
    throw new Error("SUPABASE_URL must use HTTPS (HTTP is allowed for localhost)");
  }
  if (
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error("SUPABASE_URL must be a project URL without credentials, path, query, or fragment");
  }

  return { url: parsedUrl.origin, key };
}

function getSupabaseClient(env = process.env) {
  const config = getSupabaseConfig(env);

  if (!config) {
    throw new Error("Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in backend/.env");
  }

  return createClient(config.url, config.key);
}

async function checkSupabaseConnection(env = process.env, fetchImpl = fetch) {
  const config = getSupabaseConfig(env);

  if (!config) {
    return { status: "not_configured" };
  }

  const response = await fetchImpl(`${config.url}/rest/v1/`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    return { status: "unavailable" };
  }

  return { status: "connected" };
}

module.exports = { checkSupabaseConnection, getSupabaseClient };
