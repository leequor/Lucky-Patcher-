import { authorizeProductRight } from "../../../../lib/product-access";
import { runProductLifecycleAction } from "../../../../lib/product-lifecycle.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const authorization = await authorizeProductRight(request, "restore");
  if (authorization.response) {
    return authorization.response;
  }

  const { id } = await params;
  if (!id || id.length > 100) {
    return Response.json({ error: "Choose a valid product to restore." }, { status: 400 });
  }

  return runProductLifecycleAction(authorization.supabase, "restore", id);
}
