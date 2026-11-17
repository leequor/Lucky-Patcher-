import { escapeSearchPattern, parsePageParams } from "./list-query.mjs";

export function parseProductListParams(searchParams) {
  const search = (searchParams.get("search") || "").trim();
  const unit = (searchParams.get("unit") || "").trim();
  const status = searchParams.get("status") || "active";

  if (search.length > 100 || unit.length > 40) {
    return { error: "Search must be 100 characters and unit 40 characters or fewer." };
  }
  if (!["active", "inactive", "all"].includes(status)) {
    return { error: "Choose a valid product status." };
  }

  const pagination = parsePageParams(searchParams);
  if (pagination.error) {
    return pagination;
  }

  return {
    filters: {
      search,
      unit,
      status,
      ...pagination,
    },
  };
}

export { escapeSearchPattern };
