import { authorizeUserRight, getUserRights } from "./user-access";

const PRODUCT_RIGHTS = {
  view: "products.view",
  add: "products.add",
  edit: "products.edit",
};

export function getProductRights(request) {
  return getUserRights(request, PRODUCT_RIGHTS, "Product");
}

export function authorizeProductRight(request, right) {
  return authorizeUserRight(request, PRODUCT_RIGHTS, "Product", right);
}

export function authorizeProductView(request) {
  return authorizeProductRight(request, "view");
}
