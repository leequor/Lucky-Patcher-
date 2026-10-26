# Backend API

Backend-only Node.js API with a Supabase client ready for your project credentials.

## Requirements

- Node.js 20.18 or newer
- npm

## Run locally

From the repository root:

```powershell
Copy-Item backend/.env.example backend/.env
Set-Location backend
npm start
```

The API listens on `http://127.0.0.1:3001` by default. Set `PORT` in `.env` to use a different port.

## Configure Supabase

1. Copy `.env.example` to `.env` if you have not already.
2. Fill in `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` with your project's URL and publishable key from the Supabase dashboard. The legacy `anon` key also works. Do not use or expose a service-role/secret key.
3. Install the dependency with `npm install`.

The `.env` file is ignored by Git. Import `getSupabaseClient` from `./supabase` in backend code that needs database access. It creates the client when called and reports a clear error if credentials have not been added yet.

Check that the server is running at `GET http://127.0.0.1:3001/api/health`. It returns:

```json
{ "status": "ok", "service": "api" }
```

Check Supabase configuration and connectivity at `GET http://127.0.0.1:3001/api/health/supabase`. It returns `200` when the Supabase REST API is reachable, or `503` if credentials are missing or the connection is unavailable.

Run the backend tests from this directory with `npm test`.
