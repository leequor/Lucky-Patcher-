import { authorizeDepartmentRight } from "../../../lib/department-access";
import { runDepartmentLifecycleAction } from "../../../lib/department-lifecycle.mjs";
import { validateDepartmentInput } from "../../../lib/department-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const authorization = await authorizeDepartmentRight(request, "edit");
  if (authorization.response) return authorization.response;

  const { id } = await params;
  if (!id || id.length > 20) {
    return Response.json(
      { error: "Choose a valid department to update." },
      { status: 400 },
    );
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Submit valid department details." }, { status: 400 });
  }

  const validation = validateDepartmentInput(input);
  if (validation.errors) {
    return Response.json(
      { error: "Check the highlighted department fields.", errors: validation.errors },
      { status: 422 },
    );
  }

  try {
    const { data, error } = await authorization.supabase
      .from("department")
      .update({
        deptcode: validation.value.code,
        deptname: validation.value.name,
        description: validation.value.description,
        stamp: new Date().toISOString(),
      })
      .eq("deptcode", id)
      .select(
        "id:deptcode, code:deptcode, name:deptname, description, is_deleted, stamp",
      )
      .maybeSingle();

    if (error?.code === "23505") {
      return Response.json(
        {
          error: "A department with this code already exists.",
          errors: { code: "This code is already in use." },
        },
        { status: 409 },
      );
    }
    if (error) {
      console.error("Could not update department.", error);
      return Response.json(
        { error: "Department could not be updated." },
        { status: 500 },
      );
    }
    if (!data) {
      return Response.json(
        { error: "Department was not found or is not available." },
        { status: 404 },
      );
    }

    return Response.json({ department: data });
  } catch (error) {
    console.error("Could not reach Supabase while updating a department.", error);
    return Response.json(
      { error: "Department could not be updated. Check your connection and try again." },
      { status: 502 },
    );
  }
}

export async function DELETE(request, { params }) {
  const authorization = await authorizeDepartmentRight(request, "delete");
  if (authorization.response) return authorization.response;

  const { id } = await params;
  if (!id || id.length > 20) {
    return Response.json(
      { error: "Choose a valid department to delete." },
      { status: 400 },
    );
  }

  return runDepartmentLifecycleAction(authorization.supabase, "delete", id);
}
