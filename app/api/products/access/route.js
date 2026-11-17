import { getProductRights } from "../../../lib/product-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const access = await getProductRights(request);
  if (access.response) {
    return access.response;
  }

  return Response.json({ canViewProducts: access.rights.view });
}
