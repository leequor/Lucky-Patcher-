function isActiveChildrenError(error) {
  const message = (error?.message || "").toLowerCase();
  return (
    error?.code === "23503" ||
    message.includes("active_children") ||
    message.includes("active child")
  );
}

function isNotFoundError(error) {
  const message = (error?.message || "").toLowerCase();
  return error?.code === "P0002" || message.includes("customer_not_found");
}

function lifecycleErrorResponse(error) {
  if (isActiveChildrenError(error)) {
    return Response.json(
      { error: "This customer cannot be deleted while active child records exist." },
      { status: 409 },
    );
  }
  if (isNotFoundError(error)) {
    return Response.json({ error: "Customer was not found or is not available." }, { status: 404 });
  }
  if (error?.code === "42501") {
    return Response.json({ error: "You are not allowed to change this customer." }, { status: 403 });
  }

  console.error("Customer lifecycle operation failed.", error);
  return Response.json(
    { error: "The customer could not be updated. Please try again." },
    { status: 500 },
  );
}

export async function runCustomerLifecycleAction(supabase, action, customerId) {
  const functionName =
    action === "delete" ? "soft_delete_customer" : "restore_customer";

  try {
    const { data, error } = await supabase.rpc(functionName, {
      p_customer_id: customerId,
    });

    if (error) {
      return lifecycleErrorResponse(error);
    }

    if (!data || typeof data !== "object" || typeof data.success !== "boolean") {
      console.error(`The ${functionName} RPC returned an invalid response.`, data);
      return Response.json(
        { error: "The customer operation could not be verified." },
        { status: 502 },
      );
    }

    if (!data.success) {
      if (data.code === "active_children") {
        return lifecycleErrorResponse({ message: "active_children" });
      }
      if (data.code === "not_found") {
        return lifecycleErrorResponse({ code: "P0002" });
      }
      console.error(`The ${functionName} RPC rejected the operation.`, data);
      return Response.json(
        { error: "The customer could not be updated. Please try again." },
        { status: 500 },
      );
    }

    return Response.json({ customer: data.customer || null });
  } catch (error) {
    console.error(`Could not reach Supabase during ${functionName}.`, error);
    return Response.json(
      { error: "The customer could not be updated. Check your connection and try again." },
      { status: 502 },
    );
  }
}
