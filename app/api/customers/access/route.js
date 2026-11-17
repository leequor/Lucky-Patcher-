import { getCustomerRights } from "../../../lib/customer-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const access = await getCustomerRights(request);
  if (access.response) {
    return access.response;
  }

  return Response.json({
    canViewCustomers: access.rights.view,
    canAddCustomers: access.rights.add,
    canEditCustomers: access.rights.edit,
    canDeleteCustomers: access.rights.delete,
    canRestoreCustomers: access.rights.restore,
  });
}
