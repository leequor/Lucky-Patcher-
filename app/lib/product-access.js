import { authorizeUserRight, getUserRights } from "./user-access";

const PRODUCT_RIGHTS = {
  view: "products.view",
};

export function getProductRights(request) {
  return getUserRights(request, PRODUCT_RIGHTS, "Product");
}

export function authorizeProductView(request) {
  return authorizeUserRight(request, PRODUCT_RIGHTS, "Product", "view");
}
