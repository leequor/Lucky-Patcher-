import { authorizeUserRight, getUserRights } from "./user-access";

const CUSTOMER_RIGHTS = {
  view: "customers.view",
  add: "customers.add",
  edit: "customers.edit",
  delete: "customers.delete",
  restore: "customers.restore",
};

export function getCustomerRights(request) {
  return getUserRights(request, CUSTOMER_RIGHTS, "Customer");
}

export function authorizeCustomerRight(request, right) {
  return authorizeUserRight(request, CUSTOMER_RIGHTS, "Customer", right);
}

export function authorizeCustomerView(request) {
  return authorizeCustomerRight(request, "view");
}
