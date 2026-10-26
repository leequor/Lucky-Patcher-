const { createServer } = require("node:http");
const { checkSupabaseConnection } = require("./supabase");

function createApp({ checkConnection = checkSupabaseConnection } = {}) {
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
