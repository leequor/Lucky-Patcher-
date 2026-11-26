export const JOB_PAGE_SIZE = 10;

export function parseJobListParams(searchParams) {
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || String(JOB_PAGE_SIZE));
  const search = (searchParams.get("search") || "").trim();
  const status = searchParams.get("status") || "active";

  if (!Number.isInteger(page) || page < 1) {
    return { error: "Page must be a positive integer." };
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return { error: "Page size must be between 1 and 100." };
  }
  if (!["active", "deleted"].includes(status)) {
    return { error: "Status must be active or deleted." };
  }
  if (search.length > 100) {
    return { error: "Search must be 100 characters or fewer." };
  }

  return { filters: { search, status, page, pageSize } };
}

export function escapeJobSearch(search) {
  return search.replaceAll("\\", "\\\\").replaceAll("*", "\\*").replaceAll("%", "\\%");
}
