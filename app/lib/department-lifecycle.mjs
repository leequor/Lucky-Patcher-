function lifecycleErrorResponse(error, action) {
  const message = (error?.message || "").toLowerCase();

  if (error?.code === "42501") {
    return Response.json(
      { error: "You are not allowed to change this department." },
      { status: 403 },
    );
  }
  if (error?.code === "P0002" || message.includes("department_not_found")) {
    return Response.json(
      { error: "Department was not found or is not available." },
      { status: 404 },
    );
  }
  if (error?.code === "23503" || message.includes("department_has_children")) {
    return Response.json(
      { error: "This department cannot be deleted while child records exist." },
      { status: 409 },
    );
  }

  console.error(`Department ${action} lifecycle operation failed.`, error);
  return Response.json(
    { error: `Department could not be ${action === "delete" ? "deleted" : "restored"}. Please try again.` },
    { status: 500 },
  );
}

export async function runDepartmentLifecycleAction(
  supabase,
  action,
  departmentId,
) {
  const functionName =
    action === "delete" ? "soft_delete_department" : "restore_department";

  try {
    const { data, error } = await supabase.rpc(functionName, {
      p_department_id: departmentId,
    });

    if (error) return lifecycleErrorResponse(error, action);
    if (!data || typeof data !== "object" || typeof data.success !== "boolean") {
      console.error(`The ${functionName} RPC returned an invalid response.`, data);
      return Response.json(
        { error: "The department operation could not be verified." },
        { status: 502 },
      );
    }
    if (!data.success) {
      if (data.code === "not_found") {
        return lifecycleErrorResponse({ code: "P0002" }, action);
      }
      if (data.code === "department_has_children") {
        return lifecycleErrorResponse(
          { code: "23503", message: "department_has_children" },
          action,
        );
      }
      console.error(`The ${functionName} RPC rejected the operation.`, data);
      return Response.json(
        { error: "The department could not be updated. Please try again." },
        { status: 500 },
      );
    }

    return Response.json({ department: data.department || null });
  } catch (error) {
    console.error(`Could not reach Supabase during ${functionName}.`, error);
    return Response.json(
      { error: "The department could not be updated. Check your connection and try again." },
      { status: 502 },
    );
  }
}
