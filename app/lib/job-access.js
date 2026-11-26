import { authorizeUserRight, getUserRights } from "./user-access";

const JOB_RIGHTS = {
  view: "jobs.view",
  add: "jobs.add",
  edit: "jobs.edit",
  delete: "jobs.delete",
  restore: "jobs.restore",
};

export function getJobRights(request) {
  return getUserRights(request, JOB_RIGHTS, "Job");
}

export function authorizeJobRight(request, right) {
  return authorizeUserRight(request, JOB_RIGHTS, "Job", right);
}
