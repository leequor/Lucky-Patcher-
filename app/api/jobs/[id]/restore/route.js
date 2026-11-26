import { authorizeJobRight } from "../../../../lib/job-access";
import { runJobLifecycleAction } from "../../../../lib/job-lifecycle.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const authorization = await authorizeJobRight(request, "restore");
  if (authorization.response) return authorization.response;

  const { id } = await params;
  if (!id || id.length > 20) {
    return Response.json({ error: "Choose a valid job to restore." }, { status: 400 });
  }
  return runJobLifecycleAction(authorization.supabase, "restore", id);
}
