const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { createApp } = require("../server");
const { checkSupabaseConnection, getSupabaseClient } = require("../supabase");

let server;
let baseUrl;

before(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("API health endpoint reports that the API is running", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", service: "api" });
});

test("Supabase client requires project credentials", () => {
  assert.throws(
    () => getSupabaseClient({}),
    /Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in backend\/\.env/,
  );
});

test("Supabase connection check validates the configured REST endpoint", async () => {
  let requestedUrl;
  let requestedHeaders;
  const result = await checkSupabaseConnection(
    {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    },
    async (url, options) => {
      requestedUrl = url;
      requestedHeaders = options.headers;
      return { ok: true };
    },
  );

  assert.deepEqual(result, { status: "connected" });
  assert.equal(requestedUrl, "https://project.supabase.co/rest/v1/");
  assert.equal(requestedHeaders.apikey, "test-publishable-key");
  assert.equal(requestedHeaders.Authorization, "Bearer test-publishable-key");
});

test("Supabase health endpoint reports a successful connection", async () => {
  const app = createApp({
    checkConnection: async () => ({ status: "connected" }),
  });
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${app.address().port}/api/health/supabase`;

  try {
    const response = await fetch(url);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { service: "supabase", status: "connected" });
  } finally {
    await new Promise((resolve, reject) => {
      app.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("Supabase health endpoint reports missing configuration", async () => {
  const app = createApp({
    checkConnection: async () => ({ status: "not_configured" }),
  });
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${app.address().port}/api/health/supabase`;

  try {
    const response = await fetch(url);

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { service: "supabase", status: "not_configured" });
  } finally {
    await new Promise((resolve, reject) => {
      app.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("unknown endpoints return a JSON 404", async () => {
  const response = await fetch(`${baseUrl}/unknown`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Not found" });
});
