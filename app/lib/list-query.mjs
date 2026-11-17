export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export function parsePageParams(searchParams) {
  const pageValue = searchParams.get("page") || "1";
  const pageSizeValue = searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE);

  if (!/^[1-9]\d*$/.test(pageValue) || !/^[1-9]\d*$/.test(pageSizeValue)) {
    return { error: "Page and page size must be positive whole numbers." };
  }

  const page = Number(pageValue);
  const requestedPageSize = Number(pageSizeValue);
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(requestedPageSize)) {
    return { error: "Page and page size are outside the supported range." };
  }

  return {
    page,
    pageSize: Math.min(requestedPageSize, MAX_PAGE_SIZE),
  };
}

export function escapeSearchPattern(search) {
  return `"*${search.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}*"`;
}
