export async function runJobLifecycleAction(supabase, action, jobId) {
  const functionName = action === "delete" ? "soft_delete_job" : "restore_job";

  try {
    const { data, error } = await supabase.rpc(functionName, {
      p_job_id: jobId,
    });

    if (error) {
      const message = (error.message || "").toLowerCase();
      if (error.code === "42501") {
        return Response.json(
          { error: "You are not allowed to change this job." },
          { status: 403 },
        );
      }
      if (error.code === "P0002" || message.includes("job_not_found")) {
        return Response.json(
          { error: "Job was not found or is not available." },
          { status: 404 },
        );
      }
      console.error(`Job ${action} lifecycle operation failed.`, error);
      return Response.json(
        { error: "The job could not be updated. Please try again." },
        { status: 500 },
      );
    }

    if (!data || typeof data !== "object" || typeof data.success !== "boolean") {
      console.error(`The ${functionName} RPC returned an invalid response.`, data);
      return Response.json(
        { error: "The job operation could not be verified." },
        { status: 502 },
      );
    }
    if (!data.success) {
      if (data.code === "not_found") {
        return Response.json(
          { error: "Job was not found or is not available." },
          { status: 404 },
        );
      }
      return Response.json(
        { error: "The job could not be updated. Please try again." },
        { status: 500 },
      );
    }

    return Response.json({ job: data.job || null });
  } catch (error) {
    console.error(`Could not reach Supabase during ${functionName}.`, error);
    return Response.json(
      { error: "The job could not be updated. Check your connection and try again." },
      { status: 502 },
    );
  }
}
