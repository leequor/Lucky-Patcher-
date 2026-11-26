import { getDepartmentRights } from "../../../lib/department-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const access = await getDepartmentRights(request);
  if (access.response) return access.response;

  return Response.json({
    canViewDepartments: access.rights.view,
    canAddDepartments: access.rights.add,
    canEditDepartments: access.rights.edit,
    canDeleteDepartments: access.rights.delete,
    canRestoreDepartments: access.rights.restore,
  });
}
