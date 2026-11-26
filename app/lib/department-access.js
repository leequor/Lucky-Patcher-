import { authorizeUserRight, getUserRights } from "./user-access";

const DEPARTMENT_RIGHTS = {
  view: "departments.view",
  add: "departments.add",
  edit: "departments.edit",
  delete: "departments.delete",
  restore: "departments.restore",
};

export function getDepartmentRights(request) {
  return getUserRights(request, DEPARTMENT_RIGHTS, "Department");
}

export function authorizeDepartmentRight(request, right) {
  return authorizeUserRight(
    request,
    DEPARTMENT_RIGHTS,
    "Department",
    right,
  );
}
