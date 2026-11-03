export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return Response.json(
      {
        status: "not_configured",
        message: "Add the Supabase URL and anon key to your local environment.",
      },
      { status: 503 },
    );
  }

  let restUrl;
  try {
    restUrl = new URL("/rest/v1/", supabaseUrl);
    if (restUrl.protocol !== "https:" && restUrl.protocol !== "http:") {
      throw new Error("Supabase URL must use HTTP or HTTPS.");
    }
  } catch {
    return Response.json(
      {
        status: "failed",
        message: "NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL.",
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(restUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Accept: "application/openapi+json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return Response.json(
        {
          status: "failed",
          message: `Supabase responded with HTTP ${response.status}. Check the URL and anon key.`,
        },
        { status: 502 },
      );
    }

    return Response.json({
      status: "connected",
      message: "Supabase is reachable.",
    });
  } catch {
    return Response.json(
      {
        status: "failed",
        message: "Could not reach Supabase. Check the URL and network connection.",
      },
      { status: 502 },
    );
  }
}
