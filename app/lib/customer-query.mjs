import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  escapeSearchPattern,
  parsePageParams,
} from "./list-query.mjs";

export const CUSTOMER_PAGE_SIZE = DEFAULT_PAGE_SIZE;
export const CUSTOMER_MAX_PAGE_SIZE = MAX_PAGE_SIZE;

export function parseCustomerListParams(searchParams) {
  const search = (searchParams.get("search") || "").trim();
  const status = searchParams.get("status") || "active";
  const payTerms = (searchParams.get("payTerms") || "").trim();
  if (search.length > 100 || payTerms.length > 100) {
    return { error: "Search and payment terms must be 100 characters or fewer." };
  }

  if (!["active", "inactive", "all", "deleted"].includes(status)) {
    return { error: "Choose a valid customer status." };
  }

  const pagination = parsePageParams(searchParams);
  if (pagination.error) {
    return pagination;
  }

  return {
    filters: {
      search,
      status,
      payTerms,
      ...pagination,
    },
  };
}

export function escapeCustomerSearch(search) {
  return escapeSearchPattern(search);
}
