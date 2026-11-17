import { createClient } from "@supabase/supabase-js";

export async function authorizeCustomerView(request) {
  const authorization = request.headers.get("authorization") || "";
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    return {
      response: Response.json({ error: "Sign in to view customers." }, { status: 401 }),
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      response: Response.json(
        { error: "Customer access is not configured." },
        { status: 503 },
      ),
    };
  }

  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Supabase URL must use HTTP or HTTPS.");
    }
  } catch {
    return {
      response: Response.json(
        { error: "Customer access is not configured correctly." },
        { status: 500 },
      ),
    };
  }

  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: `Bearer ${tokenMatch[1]}` },
      },
    });
  } catch (error) {
    console.error("Could not initialize Supabase for customer access.", error);
    return {
      response: Response.json(
        { error: "Customer access could not be checked." },
        { status: 500 },
      ),
    };
  }

  let user;
  try {
    const {
      data: { user: authenticatedUser },
      error: authError,
    } = await supabase.auth.getUser(tokenMatch[1]);
    if (authError || !authenticatedUser) {
      return {
        response: Response.json(
          { error: "Your session has expired. Sign in again." },
          { status: 401 },
        ),
      };
    }
    user = authenticatedUser;
  } catch (error) {
    console.error("Could not validate the session for customer access.", error);
    return {
      response: Response.json(
        { error: "Customer access could not be checked. Please try again." },
        { status: 502 },
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Could not read the user's role for customer access.", profileError);
    return {
      response: Response.json(
        { error: "Customer access could not be checked." },
        { status: 500 },
      ),
    };
  }

  if (!profile) {
    return {
      response: Response.json(
        { error: "Your account does not have a customer access profile." },
        { status: 403 },
      ),
    };
  }

  if (["superadmin", "admin"].includes(profile.role)) {
    return { supabase };
  }

  const { data: permission, error: permissionError } = await supabase
    .from("user_rights")
    .select("right_code")
    .eq("user_id", user.id)
    .eq("right_code", "customers.view")
    .maybeSingle();

  if (permissionError) {
    console.error("Could not check the user's Customer view right.", permissionError);
    return {
      response: Response.json(
        { error: "Customer access could not be checked." },
        { status: 500 },
      ),
    };
  }

  if (!permission) {
    return {
      response: Response.json(
        { error: "You do not have the Customer view right." },
        { status: 403 },
      ),
    };
  }

  return { supabase };
}
