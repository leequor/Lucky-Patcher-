const { createServer } = require("node:http");
const { checkSupabaseConnection, getSupabaseClient, signUpUser } = require("./supabase");

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });
}

function createApp({
  checkConnection = checkSupabaseConnection,
  signupHandler = async (request, response) => {
    try {
      const payload = await readJsonBody(request);
      const result = await signUpUser(payload, undefined, process.env);

      response.writeHead(result.status || 400, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify(
          result.ok
            ? {
                status: "success",
                message: result.message,
                user: result.user,
              }
            : {
                error: result.message,
              },
        ),
      );
    } catch (error) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: error.message || "Invalid sign-up request." }));
    }
  },
} = {}) {
  return createServer((request, response) => {
    if (request.method === "GET" && request.url === "/api/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "ok", service: "api" }));
      return;
    }

    if (request.method === "GET" && request.url === "/api/health/supabase") {
      Promise.resolve()
        .then(checkConnection)
        .then((result) => {
          const statusCode = result.status === "connected" ? 200 : 503;
          response.writeHead(statusCode, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ service: "supabase", ...result }));
        })
        .catch(() => {
          response.writeHead(503, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ service: "supabase", status: "unavailable" }));
        });
      return;
    }

    if (request.method === "POST" && request.url === "/api/auth/signup") {
      signupHandler(request, response);
      return;
    }

    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3001);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  const server = createApp();
  server.listen(port, "127.0.0.1", () => {
    console.log(`API server listening at http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp };
