import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseProductListParams } from "../app/lib/product-query.mjs";

describe("product list query parsing", () => {
  it("defaults to active products and paginates results", () => {
    const result = parseProductListParams(new URLSearchParams("page=2"));

    assert.deepEqual(result.filters, {
      search: "",
      unit: "",
      status: "active",
      page: 2,
      pageSize: 20,
    });
  });

  it("accepts code/description search, unit, and status filters", () => {
    const result = parseProductListParams(
      new URLSearchParams("search=widget&unit=each&status=inactive&pageSize=10"),
    );

    assert.deepEqual(result.filters, {
      search: "widget",
      unit: "each",
      status: "inactive",
      page: 1,
      pageSize: 10,
    });
  });

  it("caps page size and rejects invalid status, unit, and pagination", () => {
    const capped = parseProductListParams(new URLSearchParams("pageSize=500"));
    assert.equal(capped.filters.pageSize, 50);

    assert.match(
      parseProductListParams(new URLSearchParams("status=deleted")).error,
      /valid product status/,
    );
    assert.match(
      parseProductListParams(new URLSearchParams(`unit=${"x".repeat(41)}`)).error,
      /unit 40 characters/,
    );
    assert.match(
      parseProductListParams(new URLSearchParams("page=0")).error,
      /positive whole numbers/,
    );
  });
});
