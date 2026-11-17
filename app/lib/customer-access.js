import { createClient } from "@supabase/supabase-js";

const CUSTOMER_RIGHTS = {
  view: "customers.view",
  add: "customers.add",
  edit: "customers.edit",
  delete: "customers.delete",
  restore: "customers.restore",
};

function failure(message, status) {
  return { response: Response.json({ error: message }, { status }) };
}

export async function getCustomerRights(request) {
  const authorization = request.headers.get("authorization") || "";
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    return failure("Sign in to view customers.", 401);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return failure("Customer access is not configured.", 503);
  }

  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Supabase URL must use HTTP or HTTPS.");
    }
  } catch {
    return failure("Customer access is not configured correctly.", 500);
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
    return failure("Customer access could not be checked.", 500);
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
    console.error("Could not validate the session for customer access.", error);
    return failure("Customer access could not be checked. Please try again.", 502);
  }

  let profile;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Could not read the user's role for customer access.", error);
      return failure("Customer access could not be checked.", 500);
    }
    profile = data;
  } catch (error) {
    console.error("Could not read the user's role for customer access.", error);
    return failure("Customer access could not be checked. Please try again.", 502);
  }

  if (!profile) {
    return failure("Your account does not have a customer access profile.", 403);
  }

  if (["superadmin", "admin"].includes(profile.role)) {
    return {
      supabase,
      rights: { view: true, add: true, edit: true, delete: true, restore: true },
    };
  }

  let permissions;
  try {
    const { data, error } = await supabase
      .from("user_rights")
      .select("right_code")
      .eq("user_id", user.id)
      .in("right_code", Object.values(CUSTOMER_RIGHTS));

    if (error) {
      console.error("Could not read the user's Customer rights.", error);
      return failure("Customer access could not be checked.", 500);
    }
    permissions = data;
  } catch (error) {
    console.error("Could not read the user's Customer rights.", error);
    return failure("Customer access could not be checked. Please try again.", 502);
  }

  const grantedRights = new Set((permissions || []).map(({ right_code }) => right_code));
  return {
    supabase,
    rights: {
      view: grantedRights.has(CUSTOMER_RIGHTS.view),
      add: grantedRights.has(CUSTOMER_RIGHTS.add),
      edit: grantedRights.has(CUSTOMER_RIGHTS.edit),
      delete: grantedRights.has(CUSTOMER_RIGHTS.delete),
      restore: grantedRights.has(CUSTOMER_RIGHTS.restore),
    },
  };
}

export async function authorizeCustomerRight(request, right) {
  const access = await getCustomerRights(request);
  if (access.response) {
    return access;
  }

  if (!access.rights[right]) {
    return failure(`You do not have the Customer ${right} right.`, 403);
  }

  return { supabase: access.supabase };
}

export function authorizeCustomerView(request) {
  return authorizeCustomerRight(request, "view");
}
