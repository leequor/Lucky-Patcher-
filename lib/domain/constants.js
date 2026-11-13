// Shared vocabulary for the Hope, Inc. ERP records modules.
// Keep this file free of React and browser APIs so it can be unit tested.

export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  USER: "user",
};

export const ROLE_LABELS = {
  superadmin: "Superadmin",
  admin: "Admin",
  user: "Staff",
};

export const PAY_TERMS = [
  { value: "COD", label: "Cash on delivery", short: "COD", days: 0 },
  { value: "NET_15", label: "Net 15 days", short: "Net 15", days: 15 },
  { value: "NET_30", label: "Net 30 days", short: "Net 30", days: 30 },
  { value: "NET_45", label: "Net 45 days", short: "Net 45", days: 45 },
  { value: "NET_60", label: "Net 60 days", short: "Net 60", days: 60 },
];

export const PAY_TERM_VALUES = PAY_TERMS.map((term) => term.value);

export const UNITS = [
  { value: "PC", label: "Piece", short: "pc" },
  { value: "BOX", label: "Box", short: "box" },
  { value: "SET", label: "Set", short: "set" },
  { value: "KG", label: "Kilogram", short: "kg" },
  { value: "L", label: "Litre", short: "L" },
  { value: "M", label: "Metre", short: "m" },
  { value: "HR", label: "Hour", short: "hr" },
];

export const UNIT_VALUES = UNITS.map((unit) => unit.value);

export const RECORD_STATUS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const STATUS_VALUES = RECORD_STATUS.map((status) => status.value);

export const PERMISSIONS = {
  CUSTOMER_VIEW: "customer.view",
  CUSTOMER_CREATE: "customer.create",
  CUSTOMER_EDIT: "customer.edit",
  CUSTOMER_DELETE: "customer.delete",
  PRODUCT_VIEW: "product.view",
  PRODUCT_CREATE: "product.create",
  PRODUCT_EDIT: "product.edit",
  PRODUCT_DELETE: "product.delete",
  PRICE_CREATE: "price.create",
  PRICE_EDIT: "price.edit",
  PRICE_DELETE: "price.delete",
  AUDIT_VIEW: "audit.view",
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = {
  superadmin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS.filter((permission) => permission !== "audit.view"),
  user: [PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.PRODUCT_VIEW],
};

export const AUDIT_ACTIONS = {
  CUSTOMER_CREATE: "customer.create",
  CUSTOMER_UPDATE: "customer.update",
  CUSTOMER_DELETE: "customer.delete",
  CUSTOMER_RESTORE: "customer.restore",
  PRODUCT_CREATE: "product.create",
  PRODUCT_UPDATE: "product.update",
  PRODUCT_DELETE: "product.delete",
  PRODUCT_RESTORE: "product.restore",
  PRICE_CREATE: "price.create",
  PRICE_UPDATE: "price.update",
  PRICE_DELETE: "price.delete",
};

export const AUDIT_ACTION_LABELS = {
  "customer.create": "Added",
  "customer.update": "Updated",
  "customer.delete": "Deleted",
  "customer.restore": "Restored",
  "product.create": "Added",
  "product.update": "Updated",
  "product.delete": "Deleted",
  "product.restore": "Restored",
  "price.create": "Added a price to",
  "price.update": "Changed the price of",
  "price.delete": "Removed the price of",
};

/** Phrasing for a record's own timeline, where the subject is already known. */
export const AUDIT_RECORD_LABELS = {
  "customer.create": "created this customer",
  "customer.update": "changed this customer",
  "customer.delete": "deleted this customer",
  "customer.restore": "restored this customer",
  "product.create": "created this product",
  "product.update": "changed this product",
  "product.delete": "deleted this product",
  "product.restore": "restored this product",
  "price.create": "added a price",
  "price.update": "changed a price",
  "price.delete": "removed a price",
};

export const PAGE_SIZE = 10;
