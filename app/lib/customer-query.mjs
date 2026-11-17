export const CUSTOMER_PAGE_SIZE = 20;
export const CUSTOMER_MAX_PAGE_SIZE = 50;

export function parseCustomerListParams(searchParams) {
  const search = (searchParams.get("search") || "").trim();
  const status = searchParams.get("status") || "active";
  const payTerms = (searchParams.get("payTerms") || "").trim();
  const pageValue = searchParams.get("page") || "1";
  const pageSizeValue = searchParams.get("pageSize") || String(CUSTOMER_PAGE_SIZE);

  if (search.length > 100 || payTerms.length > 100) {
    return { error: "Search and payment terms must be 100 characters or fewer." };
  }

  if (!["active", "inactive", "all"].includes(status)) {
    return { error: "Choose a valid customer status." };
  }

  if (!/^[1-9]\d*$/.test(pageValue) || !/^[1-9]\d*$/.test(pageSizeValue)) {
    return { error: "Page and page size must be positive whole numbers." };
  }

  const page = Number(pageValue);
  const requestedPageSize = Number(pageSizeValue);
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(requestedPageSize)) {
    return { error: "Page and page size are outside the supported range." };
  }

  return {
    filters: {
      search,
      status,
      payTerms,
      page,
      pageSize: Math.min(requestedPageSize, CUSTOMER_MAX_PAGE_SIZE),
    },
  };
}

export function escapeCustomerSearch(search) {
  return `"*${search.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}*"`;
}
