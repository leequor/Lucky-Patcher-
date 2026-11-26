import { authorizeJobRight } from "../../../lib/job-access";
import { runJobLifecycleAction } from "../../../lib/job-lifecycle.mjs";
import { validateJobInput } from "../../../lib/job-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const authorization = await authorizeJobRight(request, "edit");
  if (authorization.response) return authorization.response;

  const { id } = await params;
  if (!id || id.length > 20) {
    return Response.json({ error: "Choose a valid job to update." }, { status: 400 });
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Submit valid job details." }, { status: 400 });
  }

  const validation = validateJobInput(input);
  if (validation.errors) {
    return Response.json(
      { error: "Check the highlighted job fields.", errors: validation.errors },
      { status: 422 },
    );
  }

  try {
    const { data, error } = await authorization.supabase
      .from("job")
      .update({
        jobcode: validation.value.code,
        jobtitle: validation.value.title,
        description: validation.value.description,
        stamp: new Date().toISOString(),
      })
      .eq("jobcode", id)
      .select("id:jobcode, code:jobcode, title:jobtitle, description, is_deleted, stamp")
      .maybeSingle();

    if (error?.code === "23505") {
      return Response.json(
        {
          error: "A job with this code already exists.",
          errors: { code: "This code is already in use." },
        },
        { status: 409 },
      );
    }
    if (error) {
      console.error("Could not update job.", error);
      return Response.json({ error: "Job could not be updated." }, { status: 500 });
    }
    if (!data) {
      return Response.json(
        { error: "Job was not found or is not available." },
        { status: 404 },
      );
    }
    return Response.json({ job: data });
  } catch (error) {
    console.error("Could not reach Supabase while updating a job.", error);
    return Response.json(
      { error: "Job could not be updated. Check your connection and try again." },
      { status: 502 },
    );
  }
}

export async function DELETE(request, { params }) {
  const authorization = await authorizeJobRight(request, "delete");
  if (authorization.response) return authorization.response;

  const { id } = await params;
  if (!id || id.length > 20) {
    return Response.json({ error: "Choose a valid job to delete." }, { status: 400 });
  }
  return runJobLifecycleAction(authorization.supabase, "delete", id);
}
