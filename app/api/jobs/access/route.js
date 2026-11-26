import { getJobRights } from "../../../lib/job-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const access = await getJobRights(request);
  if (access.response) return access.response;

  return Response.json({
    canViewJobs: access.rights.view,
    canAddJobs: access.rights.add,
    canEditJobs: access.rights.edit,
    canDeleteJobs: access.rights.delete,
    canRestoreJobs: access.rights.restore,
  });
}
