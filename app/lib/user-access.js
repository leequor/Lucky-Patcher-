import { createClient } from "@supabase/supabase-js";

function failure(message, status) {
  return { response: Response.json({ error: message }, { status }) };
}

export async function getUserRights(request, rightCodes, moduleName) {
  const authorization = request.headers.get("authorization") || "";
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    return failure("Sign in to continue.", 401);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return failure(`${moduleName} access is not configured.`, 503);
  }

  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Supabase URL must use HTTP or HTTPS.");
    }
  } catch {
    return failure(`${moduleName} access is not configured correctly.`, 500);
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
    console.error(`Could not initialize Supabase for ${moduleName.toLowerCase()} access.`, error);
    return failure(`${moduleName} access could not be checked.`, 500);
  }

  let user;
  try {
    const {
      data: { user: authenticatedUser },
      error: authError,
    } = await supabase.auth.getUser(tokenMatch[1]);
    if (authError || !authenticatedUser) {
      return failure("Your session has expired. Sign in again.", 401);
    }
    user = authenticatedUser;
  } catch (error) {
    console.error(`Could not validate the session for ${moduleName.toLowerCase()} access.`, error);
    return failure(`${moduleName} access could not be checked. Please try again.`, 502);
  }

  let profile;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(`Could not read the user's role for ${moduleName.toLowerCase()} access.`, error);
      return failure(`${moduleName} access could not be checked.`, 500);
    }
    profile = data;
  } catch (error) {
    console.error(`Could not read the user's role for ${moduleName.toLowerCase()} access.`, error);
    return failure(`${moduleName} access could not be checked. Please try again.`, 502);
  }

  if (!profile) {
    return failure("Your account does not have an access profile.", 403);
  }

  if (["superadmin", "admin"].includes(profile.role)) {
    return {
      supabase,
      rights: Object.fromEntries(Object.keys(rightCodes).map((right) => [right, true])),
    };
  }

  let permissions;
  try {
    const { data, error } = await supabase
      .from("user_rights")
      .select("right_code")
      .eq("user_id", user.id)
      .in("right_code", Object.values(rightCodes));

    if (error) {
      console.error(`Could not read the user's ${moduleName.toLowerCase()} rights.`, error);
      return failure(`${moduleName} access could not be checked.`, 500);
    }
    permissions = data;
  } catch (error) {
    console.error(`Could not read the user's ${moduleName.toLowerCase()} rights.`, error);
    return failure(`${moduleName} access could not be checked. Please try again.`, 502);
  }

  const grantedRights = new Set((permissions || []).map(({ right_code }) => right_code));
  return {
    supabase,
    rights: Object.fromEntries(
      Object.entries(rightCodes).map(([right, code]) => [right, grantedRights.has(code)]),
    ),
  };
}

export async function authorizeUserRight(request, rightCodes, moduleName, right) {
  const access = await getUserRights(request, rightCodes, moduleName);
  if (access.response) {
    return access;
  }

  if (!access.rights[right]) {
    return {
      response: Response.json(
        { error: `You do not have the ${moduleName} ${right} right.` },
        { status: 403 },
      ),
    };
  }

  return { supabase: access.supabase };
}
