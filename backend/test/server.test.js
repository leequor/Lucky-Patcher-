const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { createApp } = require("../server");
const { checkSupabaseConnection, getSupabaseClient, normalizeRegistrationPayload, signUpUser } = require("../supabase");

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

test("Registration payload defaults dev signups to superadmin and normalizes the email", () => {
  assert.deepEqual(normalizeRegistrationPayload({ email: " User@Example.com ", password: "secret123" }, { NODE_ENV: "development" }), {
    ok: true,
    data: {
      email: "user@example.com",
      password: "secret123",
      role: "superadmin",
    },
  });
});

test("Signup rejects short passwords before contacting Supabase", async () => {
  const result = await signUpUser(
    { email: "user@example.com", password: "abc" },
    {
      auth: {
        signUp: async () => {
          throw new Error("should not reach Supabase");
        },
      },
    },
    { NODE_ENV: "development" },
  );

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    message: "Password must be at least 6 characters long.",
  });
});

test("Signup rejects duplicate emails with a clear message", async () => {
  const result = await signUpUser(
    { email: "taken@example.com", password: "secret123" },
    {
      auth: {
        signUp: async () => ({
          data: null,
          error: { message: "User already registered" },
        }),
      },
    },
    { NODE_ENV: "development" },
  );

  assert.deepEqual(result, {
    ok: false,
    status: 409,
    message: "Email already registered.",
  });
});

test("Signup endpoint accepts valid new users", async () => {
  const app = createApp({
    signupHandler: async (request, response) => {
      const payload = { email: "new@example.com", password: "secret123" };
      const result = await signUpUser(payload, {
        auth: {
          signUp: async () => ({
            data: {
              user: {
                id: "user-1",
                email: "new@example.com",
                user_metadata: { role: "superadmin" },
              },
            },
            error: null,
          }),
        },
      }, { NODE_ENV: "development" });

      response.writeHead(result.status, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: result.ok ? "success" : "error", message: result.message, user: result.user }));
    },
  });

  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${app.address().port}/api/auth/signup`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "new@example.com", password: "secret123" }),
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      status: "success",
      message: "User registered successfully.",
      user: {
        id: "user-1",
        email: "new@example.com",
        role: "superadmin",
      },
    });
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
