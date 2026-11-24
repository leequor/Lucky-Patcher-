import { authorizeUserRight, getUserRights } from "./user-access";

const PRODUCT_PRICE_RIGHTS = {
  view: "products.price.view",
  add: "products.price.add",
  edit: "products.price.edit",
  delete: "products.price.delete",
};

const PRODUCT_RIGHTS = {
  view: "products.view",
  add: "products.add",
  edit: "products.edit",
  delete: "products.delete",
  restore: "products.restore",
  priceView: "products.price.view",
  priceAdd: "products.price.add",
  priceEdit: "products.price.edit",
  priceDelete: "products.price.delete",
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

export function authorizeProductPriceRight(request, right) {
  return authorizeUserRight(request, PRODUCT_PRICE_RIGHTS, "Product price", right);
}
