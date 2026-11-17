import { authorizeCustomerRight } from "../../../../lib/customer-access";
import { runCustomerLifecycleAction } from "../../../../lib/customer-lifecycle.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const authorization = await authorizeCustomerRight(request, "restore");
  if (authorization.response) {
    return authorization.response;
  }

  const { id } = await params;
  if (!id || id.length > 100) {
    return Response.json({ error: "Choose a valid customer to restore." }, { status: 400 });
  }

  return runCustomerLifecycleAction(authorization.supabase, "restore", id);
}
