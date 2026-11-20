function isActiveChildrenError(error) {
  const message = (error?.message || "").toLowerCase();
  return (
    error?.code === "23503" ||
    message.includes("active_children") ||
    message.includes("active child") ||
    message.includes("price history") ||
    message.includes("sale details")
  );
}

function isNotFoundError(error) {
  const message = (error?.message || "").toLowerCase();
  return error?.code === "P0002" || message.includes("product_not_found");
}

function lifecycleErrorResponse(error) {
  if (isActiveChildrenError(error)) {
    return Response.json(
      { error: "This product cannot be deleted while active price history or sale details exist." },
      { status: 409 },
    );
  }
  if (isNotFoundError(error)) {
    return Response.json({ error: "Product was not found or is not available." }, { status: 404 });
  }
  if (error?.code === "42501") {
    return Response.json({ error: "You are not allowed to change this product." }, { status: 403 });
  }

  console.error("Product lifecycle operation failed.", error);
  return Response.json(
    { error: "The product could not be updated. Please try again." },
    { status: 500 },
  );
}

export async function runProductLifecycleAction(supabase, action, productId) {
  const functionName =
    action === "delete" ? "soft_delete_product" : "restore_product";

  try {
    const { data, error } = await supabase.rpc(functionName, {
      p_product_id: productId,
    });

    if (error) {
      return lifecycleErrorResponse(error);
    }

    if (!data || typeof data !== "object" || typeof data.success !== "boolean") {
      console.error(`The ${functionName} RPC returned an invalid response.`, data);
      return Response.json(
        { error: "The product operation could not be verified." },
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
        { error: "The product could not be updated. Please try again." },
        { status: 500 },
      );
    }

    return Response.json({ product: data.product || null });
  } catch (error) {
    console.error(`Could not reach Supabase during ${functionName}.`, error);
    return Response.json(
      { error: "The product could not be updated. Check your connection and try again." },
      { status: 502 },
    );
  }
}
