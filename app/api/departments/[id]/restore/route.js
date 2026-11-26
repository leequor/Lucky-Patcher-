import { authorizeDepartmentRight } from "../../../../lib/department-access";
import { runDepartmentLifecycleAction } from "../../../../lib/department-lifecycle.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const authorization = await authorizeDepartmentRight(request, "restore");
  if (authorization.response) return authorization.response;

  const { id } = await params;
  if (!id || id.length > 20) {
    return Response.json(
      { error: "Choose a valid department to restore." },
      { status: 400 },
    );
  }

  return runDepartmentLifecycleAction(authorization.supabase, "restore", id);
}
