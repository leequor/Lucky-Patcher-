import { assertCan } from "../domain/permissions.js";
import {
  AUDIT_ACTIONS,
  PAGE_SIZE,
  PAY_TERMS,
  PERMISSIONS,
  UNITS,
} from "../domain/constants.js";
import {
  normalizeCode,
  normalizeText,
  parseMoneyInput,
  validateCustomer,
  validatePrice,
  validateProduct,
} from "../domain/validation.js";
import { sortPricesDescending, priceAsOf } from "../domain/pricing.js";
import { formatMoney, formatDate, todayISO } from "../domain/format.js";
import { AppError, getState, newId, nowISO, persist } from "./storage.js";

const customerLabels = {
  code: "code",
  name: "name",
  contactPerson: "contact person",
  email: "email",
  phone: "phone",
  address: "address",
  payTerms: "payment terms",
  status: "status",
  notes: "notes",
};

const productLabels = {
  code: "code",
  description: "description",
  unit: "unit",
  status: "status",
  notes: "notes",
};

export function payTermLabel(value) {
  return PAY_TERMS.find((term) => term.value === value)?.short ?? value;
}

export function unitLabel(value) {
  return UNITS.find((unit) => unit.value === value)?.short ?? value;
}

function actorOrThrow(actor) {
  if (!actor) {
    throw new AppError("You need to sign in to continue.", {
      code: "unauthenticated",
      status: 401,
    });
  }
  return actor;
}

function pushAudit(state, actor, action, entity, entityId, entityLabel, detail, extra = {}) {
  state.audit.unshift({
    id: newId("aud"),
    at: nowISO(),
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    action,
    entity,
    entityId,
    entityLabel,
    detail,
    ...extra,
  });
}

function textIncludes(value, query) {
  return String(value ?? "").toLowerCase().includes(query);
}

function paginate(rows, page, pageSize) {
  const total = rows.length;
  const size = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * size;
  return {
    rows: rows.slice(start, start + size),
    total,
    page: safePage,
    pageSize: size,
    pageCount,
  };
}

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

function customerCodeExists(state, code, excludeId = null) {
  const target = normalizeCode(code);
  return state.customers.some(
    (customer) => customer.code === target && customer.id !== excludeId,
  );
}

export async function listCustomers({
  q = "",
  status = "all",
  payTerms = "all",
  sort = "name",
  page = 1,
  pageSize = PAGE_SIZE,
} = {}) {
  const state = await getState();
  const query = normalizeText(q).toLowerCase();

  let rows = state.customers.filter((customer) => {
    if (status === "deleted") return customer.isDeleted;
    if (status === "all") return !customer.isDeleted;
    if (status === "active" || status === "inactive") {
      return !customer.isDeleted && customer.status === status;
    }
    return !customer.isDeleted;
  });

  if (payTerms !== "all") {
    rows = rows.filter((customer) => customer.payTerms === payTerms);
  }

  if (query) {
    rows = rows.filter(
      (customer) =>
        textIncludes(customer.code, query) ||
        textIncludes(customer.name, query) ||
        textIncludes(customer.contactPerson, query) ||
        textIncludes(customer.email, query) ||
        textIncludes(customer.phone, query),
    );
  }

  const sorted = [...rows].sort((a, b) => {
    if (sort === "code") return a.code.localeCompare(b.code);
    if (sort === "updated") return String(b.updatedAt).localeCompare(String(a.updatedAt));
    return a.name.localeCompare(b.name);
  });

  return paginate(sorted, page, pageSize);
}

export async function getCustomer(id) {
  const state = await getState();
  return state.customers.find((customer) => customer.id === id) ?? null;
}

export async function createCustomer(input, actor) {
  actorOrThrow(actor);
  assertCan(actor, PERMISSIONS.CUSTOMER_CREATE);

  const state = await getState();
  const validation = validateCustomer(input, {
    codeExists: (code) => customerCodeExists(state, code),
  });

  if (!validation.ok) {
    throw new AppError("Check the highlighted fields and try again.", {
      code: "validation",
      status: 422,
      errors: validation.errors,
    });
  }

  const timestamp = nowISO();
  const customer = {
    id: newId("cus"),
    code: normalizeCode(input.code),
    name: normalizeText(input.name),
    contactPerson: normalizeText(input.contactPerson),
    email: normalizeText(input.email),
    phone: normalizeText(input.phone),
    address: normalizeText(input.address),
    payTerms: input.payTerms,
    status: input.status,
    notes: normalizeText(input.notes),
    isDeleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: actor.id,
    updatedBy: actor.id,
  };

  state.customers.unshift(customer);
  pushAudit(
    state,
    actor,
    AUDIT_ACTIONS.CUSTOMER_CREATE,
    "customer",
    customer.id,
    customer.name,
    `Added customer ${customer.code} with ${payTermLabel(customer.payTerms)} terms.`,
  );
  persist();

  return customer;
}

export async function updateCustomer(id, input, actor) {
  actorOrThrow(actor);
  assertCan(actor, PERMISSIONS.CUSTOMER_EDIT);

  const state = await getState();
  const index = state.customers.findIndex((customer) => customer.id === id);
  if (index === -1) {
    throw new AppError("That customer no longer exists.", {
      code: "not_found",
      status: 404,
    });
  }

  const current = state.customers[index];
  if (current.isDeleted) {
    throw new AppError("Restore this customer before editing it.", {
      code: "deleted",
      status: 409,
    });
  }

  const validation = validateCustomer(input, {
    codeExists: (code) => customerCodeExists(state, code, id),
  });

  if (!validation.ok) {
    throw new AppError("Check the highlighted fields and try again.", {
      code: "validation",
      status: 422,
      errors: validation.errors,
    });
  }

  const next = {
    ...current,
    code: normalizeCode(input.code),
    name: normalizeText(input.name),
    contactPerson: normalizeText(input.contactPerson),
    email: normalizeText(input.email),
    phone: normalizeText(input.phone),
    address: normalizeText(input.address),
    payTerms: input.payTerms,
    status: input.status,
    notes: normalizeText(input.notes),
    updatedAt: nowISO(),
    updatedBy: actor.id,
  };

  const changes = [];
  Object.keys(customerLabels).forEach((field) => {
    if (String(current[field] ?? "") !== String(next[field] ?? "")) {
      if (field === "payTerms") {
        changes.push(`terms ${payTermLabel(current[field])} to ${payTermLabel(next[field])}`);
      } else if (field === "status") {
        changes.push(`status ${current[field]} to ${next[field]}`);
      } else if (field !== "notes") {
        changes.push(`${customerLabels[field]} updated`);
      }
    }
  });

  state.customers[index] = next;

  if (changes.length > 0) {
    pushAudit(
      state,
      actor,
      AUDIT_ACTIONS.CUSTOMER_UPDATE,
      "customer",
      next.id,
      next.name,
      `Changed ${changes.join(", ")}.`,
    );
  }

  persist();

  return next;
}

export async function countCustomerChildren(id) {
  const state = await getState();
  // Customers gain child records with the sales module. Nothing is linked yet,
  // so the guard reports zero and the delete proceeds.
  return state.orders ? state.orders.filter((order) => order.customerId === id && !order.isDeleted).length : 0;
}

export async function deleteCustomer(id, actor) {
  actorOrThrow(actor);
  assertCan(actor, PERMISSIONS.CUSTOMER_DELETE);

  const state = await getState();
  const customer = state.customers.find((row) => row.id === id);
  if (!customer) {
    throw new AppError("That customer no longer exists.", {
      code: "not_found",
      status: 404,
    });
  }
  if (customer.isDeleted) {
    throw new AppError("This customer is already deleted.", {
      code: "already_deleted",
      status: 409,
    });
  }

  const children = await countCustomerChildren(id);
  if (children > 0) {
    throw new AppError(
      `This customer still has ${children} active record${children === 1 ? "" : "s"}. Close them first, or set the customer to Inactive.`,
      { code: "has_children", status: 409 },
    );
  }

  customer.isDeleted = true;
  customer.deletedAt = nowISO();
  customer.deletedBy = actor.id;
  customer.updatedAt = customer.deletedAt;
  customer.updatedBy = actor.id;

  pushAudit(
    state,
    actor,
    AUDIT_ACTIONS.CUSTOMER_DELETE,
    "customer",
    customer.id,
    customer.name,
    `Soft deleted ${customer.code}. Record kept for history.`,
  );
  persist();

  return customer;
}

export async function restoreCustomer(id, actor) {
  actorOrThrow(actor);
  assertCan(actor, PERMISSIONS.CUSTOMER_DELETE);

  const state = await getState();
  const customer = state.customers.find((row) => row.id === id);
  if (!customer) {
    throw new AppError("That customer no longer exists.", {
      code: "not_found",
      status: 404,
    });
  }
  if (!customer.isDeleted) {
    throw new AppError("This customer is already active.", {
      code: "not_deleted",
      status: 409,
    });
  }

  customer.isDeleted = false;
  customer.deletedAt = null;
  customer.deletedBy = null;
  customer.updatedAt = nowISO();
  customer.updatedBy = actor.id;

  pushAudit(
    state,
    actor,
    AUDIT_ACTIONS.CUSTOMER_RESTORE,
    "customer",
    customer.id,
    customer.name,
    `Restored ${customer.code}.`,
  );
  persist();

  return customer;
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

function productCodeExists(state, code, excludeId = null) {
  const target = normalizeCode(code);
  return state.products.some(
    (product) => product.code === target && product.id !== excludeId,
  );
}

function activePricesFor(state, productId) {
  return state.prices.filter(
    (price) => price.productId === productId && !price.isDeleted,
  );
}

function decorateProduct(state, product, asOf = todayISO()) {
  const prices = activePricesFor(state, product.id);
  const current = priceAsOf(prices, asOf);
  return {
    ...product,
    priceCount: prices.length,
    currentPrice: current,
    currentPriceMissing: !current,
  };
}

export async function listProducts({
  q = "",
  unit = "all",
  status = "all",
  priceState = "all",
  sort = "code",
  page = 1,
  pageSize = PAGE_SIZE,
  asOf = todayISO(),
} = {}) {
  const state = await getState();
  const query = normalizeText(q).toLowerCase();

  let rows = state.products.filter((product) => {
    if (status === "deleted") return product.isDeleted;
    if (status === "all") return !product.isDeleted;
    if (status === "active" || status === "inactive") {
      return !product.isDeleted && product.status === status;
    }
    return !product.isDeleted;
  });

  if (unit !== "all") {
    rows = rows.filter((product) => product.unit === unit);
  }

  if (query) {
    rows = rows.filter(
      (product) =>
        textIncludes(product.code, query) ||
        textIncludes(product.description, query) ||
        textIncludes(product.notes, query),
    );
  }

  const decorated = rows.map((product) => decorateProduct(state, product, asOf));

  const priced =
    priceState === "missing"
      ? decorated.filter((product) => !product.currentPrice)
      : priceState === "set"
        ? decorated.filter((product) => Boolean(product.currentPrice))
        : decorated;

  const sorted = priced.sort((a, b) => {
    if (sort === "description") return a.description.localeCompare(b.description);
    if (sort === "price") {
      return (b.currentPrice?.amount ?? -1) - (a.currentPrice?.amount ?? -1);
    }
    if (sort === "updated") return String(b.updatedAt).localeCompare(String(a.updatedAt));
    return a.code.localeCompare(b.code);
  });

  return paginate(sorted, page, pageSize);
}

export async function getProduct(id, { asOf = todayISO() } = {}) {
  const state = await getState();
  const product = state.products.find((row) => row.id === id);
  if (!product) return null;
  return decorateProduct(state, product, asOf);
}

export async function createProduct(input, actor) {
  actorOrThrow(actor);
  assertCan(actor, PERMISSIONS.PRODUCT_CREATE);

  const state = await getState();
  const validation = validateProduct(input, {
    codeExists: (code) => productCodeExists(state, code),
  });

  if (!validation.ok) {
    throw new AppError("Check the highlighted fields and try again.", {
      code: "validation",
      status: 422,
      errors: validation.errors,
    });
  }

  const timestamp = nowISO();
  const product = {
    id: newId("prd"),
    code: normalizeCode(input.code),
    description: normalizeText(input.description),
    unit: input.unit,
    status: input.status,
    notes: normalizeText(input.notes),
    isDeleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: actor.id,
    updatedBy: actor.id,
  };

  state.products.unshift(product);
  pushAudit(
    state,
    actor,
    AUDIT_ACTIONS.PRODUCT_CREATE,
    "product",
    product.id,
    product.description,
    `Added product ${product.code}. No price set yet.`,
  );
  persist();

  return product;
}

export async function updateProduct(id, input, actor) {
  actorOrThrow(actor);
  assertCan(actor, PERMISSIONS.PRODUCT_EDIT);

  const state = await getState();
  const index = state.products.findIndex((product) => product.id === id);
  if (index === -1) {
    throw new AppError("That product no longer exists.", {
      code: "not_found",
      status: 404,
    });
  }

  const current = state.products[index];
  if (current.isDeleted) {
    throw new AppError("Restore this product before editing it.", {
      code: "deleted",
      status: 409,
    });
  }

  const validation = validateProduct(input, {
    codeExists: (code) => productCodeExists(state, code, id),
  });

  if (!validation.ok) {
    throw new AppError("Check the highlighted fields and try again.", {
      code: "validation",
      status: 422,
      errors: validation.errors,
    });
  }

  const next = {
    ...current,
    code: normalizeCode(input.code),
    description: normalizeText(input.description),
    unit: input.unit,
    status: input.status,
    notes: normalizeText(input.notes),
    updatedAt: nowISO(),
    updatedBy: actor.id,
  };

  const changes = [];
  Object.keys(productLabels).forEach((field) => {
    if (String(current[field] ?? "") !== String(next[field] ?? "")) {
      if (field === "unit") {
        changes.push(`unit ${unitLabel(current[field])} to ${unitLabel(next[field])}`);
      } else if (field === "status") {
        changes.push(`status ${current[field]} to ${next[field]}`);
      } else if (field !== "notes") {
        changes.push(`${productLabels[field]} updated`);
      }
    }
  });

  state.products[index] = next;

  if (changes.length > 0) {
    pushAudit(
      state,
      actor,
      AUDIT_ACTIONS.PRODUCT_UPDATE,
      "product",
      next.id,
      next.description,
      `Changed ${changes.join(", ")}.`,
    );
  }

  persist();

  return next;
}

export async function countProductChildren(id) {
  const state = await getState();
  return activePricesFor(state, id).length;
}

export async function deleteProduct(id, actor) {
  actorOrThrow(actor);
  assertCan(actor, PERMISSIONS.PRODUCT_DELETE);

  const state = await getState();
  const product = state.products.find((row) => row.id === id);
  if (!product) {
    throw new AppError("That product no longer exists.", {
      code: "not_found",
      status: 404,
    });
  }
  if (product.isDeleted) {
    throw new AppError("This product is already deleted.", {
      code: "already_deleted",
      status: 409,
    });
  }

  const children = await countProductChildren(id);
  if (children > 0) {
    throw new AppError(
      `This product has ${children} price record${children === 1 ? "" : "s"}. Delete the price history first, or set the product to Inactive to retire it.`,
      { code: "has_children", status: 409 },
    );
  }

  product.isDeleted = true;
  product.deletedAt = nowISO();
  product.deletedBy = actor.id;
  product.updatedAt = product.deletedAt;
  product.updatedBy = actor.id;

  pushAudit(
    state,
    actor,
    AUDIT_ACTIONS.PRODUCT_DELETE,
    "product",
    product.id,
    product.description,
    `Soft deleted ${product.code}. Record kept for history.`,
  );
  persist();

  return product;
}

export async function restoreProduct(id, actor) {
  actorOrThrow(actor);
  assertCan(actor, PERMISSIONS.PRODUCT_DELETE);

  const state = await getState();
  const product = state.products.find((row) => row.id === id);
  if (!product) {
    throw new AppError("That product no longer exists.", {
      code: "not_found",
      status: 404,
    });
  }
  if (!product.isDeleted) {
    throw new AppError("This product is already active.", {
      code: "not_deleted",
      status: 409,
    });
  }

  product.isDeleted = false;
  product.deletedAt = null;
  product.deletedBy = null;
  product.updatedAt = nowISO();
  product.updatedBy = actor.id;

  pushAudit(
    state,
    actor,
    AUDIT_ACTIONS.PRODUCT_RESTORE,
    "product",
    product.id,
    product.description,
    `Restored ${product.code} with its price history intact.`,
  );
  persist();

  return product;
}

/* ------------------------------------------------------------------ */
/* Price history                                                       */
/* ------------------------------------------------------------------ */

export async function listPrices(productId) {
  const state = await getState();
  return sortPricesDescending(activePricesFor(state, productId));
}

export async function listAllPrices(productId) {
  const state = await getState();
  return sortPricesDescending(
    state.prices.filter((price) => price.productId === productId),
  );
}

export async function addPrice(productId, input, actor) {
  actorOrThrow(actor);
  assertCan(actor, PERMISSIONS.PRICE_CREATE);

  const state = await getState();
  const product = state.products.find((row) => row.id === productId);
  if (!product || product.isDeleted) {
    throw new AppError("That product no longer exists.", {
      code: "not_found",
      status: 404,
    });
  }

  const existing = activePricesFor(state, productId);
  const validation = validatePrice(input, { prices: existing });

  if (!validation.ok) {
    throw new AppError("Check the highlighted fields and try again.", {
      code: "validation",
      status: 422,
      errors: validation.errors,
    });
  }

  const timestamp = nowISO();
  const price = {
    id: newId("prc"),
    productId,
    amount: parseMoneyInput(input.amount),
    effectiveDate: input.effectiveDate,
    note: normalizeText(input.note),
    isDeleted: false,
    createdAt: timestamp,
    createdBy: actor.id,
    updatedAt: timestamp,
    updatedBy: actor.id,
  };

  state.prices.unshift(price);

  pushAudit(
    state,
    actor,
    AUDIT_ACTIONS.PRICE_CREATE,
    "price",
    price.id,
    product.description,
    `Added price ${formatMoney(price.amount)} effective ${formatDate(price.effectiveDate)}.`,
    { parentId: productId },
  );
  persist();

  return price;
}

export async function updatePrice(priceId, input, actor) {
  actorOrThrow(actor);
  assertCan(actor, PERMISSIONS.PRICE_EDIT);

  const state = await getState();
  const index = state.prices.findIndex((row) => row.id === priceId);
  if (index === -1) {
    throw new AppError("That price record no longer exists.", {
      code: "not_found",
      status: 404,
    });
  }

  const current = state.prices[index];
  const product = state.products.find((row) => row.id === current.productId);
  const existing = activePricesFor(state, current.productId);
  const validation = validatePrice(input, { prices: existing, priceId });

  if (!validation.ok) {
    throw new AppError("Check the highlighted fields and try again.", {
      code: "validation",
      status: 422,
      errors: validation.errors,
    });
  }

  const next = {
    ...current,
    amount: parseMoneyInput(input.amount),
    effectiveDate: input.effectiveDate,
    note: normalizeText(input.note),
    updatedAt: nowISO(),
    updatedBy: actor.id,
  };

  state.prices[index] = next;

  const parts = [];
  if (current.amount !== next.amount) {
    parts.push(`${formatMoney(current.amount)} to ${formatMoney(next.amount)}`);
  }
  if (current.effectiveDate !== next.effectiveDate) {
    parts.push(`date ${formatDate(current.effectiveDate)} to ${formatDate(next.effectiveDate)}`);
  }

  pushAudit(
    state,
    actor,
    AUDIT_ACTIONS.PRICE_UPDATE,
    "price",
    next.id,
    product?.description ?? "Product",
    parts.length > 0
      ? `Price changed ${parts.join(", ")}.`
      : `Saved price ${formatMoney(next.amount)} without changes.`,
    { parentId: current.productId },
  );
  persist();

  return next;
}

export async function deletePrice(priceId, actor) {
  actorOrThrow(actor);
  assertCan(actor, PERMISSIONS.PRICE_DELETE);

  const state = await getState();
  const price = state.prices.find((row) => row.id === priceId);
  if (!price) {
    throw new AppError("That price record no longer exists.", {
      code: "not_found",
      status: 404,
    });
  }
  if (price.isDeleted) {
    throw new AppError("This price record is already deleted.", {
      code: "already_deleted",
      status: 409,
    });
  }

  price.isDeleted = true;
  price.deletedAt = nowISO();
  price.deletedBy = actor.id;
  price.updatedAt = price.deletedAt;
  price.updatedBy = actor.id;

  const product = state.products.find((row) => row.id === price.productId);

  pushAudit(
    state,
    actor,
    AUDIT_ACTIONS.PRICE_DELETE,
    "price",
    price.id,
    product?.description ?? "Product",
    `Deleted price ${formatMoney(price.amount)} effective ${formatDate(price.effectiveDate)}.`,
    { parentId: price.productId },
  );
  persist();

  return price;
}

/* ------------------------------------------------------------------ */
/* Audit and reporting                                                 */
/* ------------------------------------------------------------------ */

export async function listAudit({
  entity = "all",
  page = 1,
  pageSize = 12,
  q = "",
} = {}) {
  const state = await getState();
  const query = normalizeText(q).toLowerCase();

  let rows = [...state.audit].sort((a, b) => String(b.at).localeCompare(String(a.at)));

  if (entity !== "all") {
    rows = rows.filter((entry) => entry.entity === entity);
  }

  if (query) {
    rows = rows.filter(
      (entry) =>
        textIncludes(entry.actorName, query) ||
        textIncludes(entry.entityLabel, query) ||
        textIncludes(entry.detail, query),
    );
  }

  return paginate(rows, page, pageSize);
}

export async function listAuditFor(entity, entityId, limit = 8) {
  const state = await getState();
  return state.audit
    .filter(
      (entry) =>
        (entry.entity === entity && entry.entityId === entityId) ||
        (entry.parentId && entry.parentId === entityId),
    )
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, limit);
}

export async function getWorkspaceStats() {
  const state = await getState();
  const today = todayISO();
  const activeCustomers = state.customers.filter((row) => !row.isDeleted && row.status === "active");
  const activeProducts = state.products.filter((row) => !row.isDeleted && row.status === "active");
  const withoutPrice = activeProducts.filter(
    (product) => !priceAsOf(activePricesFor(state, product.id), today),
  );

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const recentChanges = state.audit.filter((entry) => entry.at >= thirtyDaysAgo);

  return {
    activeCustomers: activeCustomers.length,
    inactiveCustomers: state.customers.filter((row) => !row.isDeleted && row.status === "inactive").length,
    activeProducts: activeProducts.length,
    productsWithoutPrice: withoutPrice.length,
    productsWithoutPriceList: withoutPrice.map((product) => ({
      id: product.id,
      code: product.code,
      description: product.description,
    })),
    priceRecords: state.prices.filter((price) => !price.isDeleted).length,
    recentChanges: recentChanges.length,
    deletedRecords:
      state.customers.filter((row) => row.isDeleted).length +
      state.products.filter((row) => row.isDeleted).length,
    lastActivityAt: state.audit[0]?.at ?? null,
  };
}

export async function getProductPricesForRange(productId, asOf) {
  const state = await getState();
  const prices = activePricesFor(state, productId);
  return {
    prices: sortPricesDescending(prices),
    current: priceAsOf(prices, asOf),
  };
}

export async function listTeam() {
  const state = await getState();
  return state.users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }));
}

export async function getUserName(userId) {
  const state = await getState();
  return state.users.find((user) => user.id === userId)?.name ?? "Unknown user";
}
