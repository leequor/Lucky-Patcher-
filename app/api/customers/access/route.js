import { authorizeCustomerView } from "../../../lib/customer-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const authorization = await authorizeCustomerView(request);
  if (authorization.response) {
    return authorization.response;
  }

  return Response.json({ canViewCustomers: true });
}
