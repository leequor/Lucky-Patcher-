import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseProductListParams } from "../app/lib/product-query.mjs";
import { PRODUCT_UNITS, validateProductInput } from "../app/lib/product-validation.mjs";

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

  describe("product form validation", () => {
    it("normalizes valid product fields for storage", () => {
      const result = validateProductInput({
        code: " P-001 ",
        description: " Widget ",
        unit: " EACH ",
        current_price: "malicious direct price update",
        status: "inactive",
      });

      assert.deepEqual(result, {
        value: {
          code: "P-001",
          description: "Widget",
          unit: "each",
        },
      });
    });

    it("requires the core fields and rejects unsupported units and statuses", () => {
      const result = validateProductInput({
        code: "",
        description: "",
        unit: "pallet",
      });

      assert.equal(result.errors.code, "Product code is required.");
      assert.equal(result.errors.description, "Product description is required.");
      assert.equal(result.errors.unit, "Choose one of the allowed units.");
    });

    it("rejects field-length limits", () => {
      const result = validateProductInput({
        code: "C".repeat(21),
        description: "D".repeat(201),
        unit: PRODUCT_UNITS[0],
      });

      assert.equal(result.errors.code, "Product code must be 20 characters or fewer.");
      assert.equal(
        result.errors.description,
        "Product description must be 200 characters or fewer.",
      );
    });
  });

  it("accepts code/description search, unit, and status filters", () => {
    const result = parseProductListParams(
      new URLSearchParams("search=widget&unit=each&status=all&pageSize=10"),
    );

    assert.deepEqual(result.filters, {
      search: "widget",
      unit: "each",
      status: "all",
      page: 1,
      pageSize: 10,
    });
  });

  it("caps page size and rejects invalid status, unit, and pagination", () => {
    const capped = parseProductListParams(new URLSearchParams("pageSize=500"));
    assert.equal(capped.filters.pageSize, 50);

    const deleted = parseProductListParams(new URLSearchParams("status=deleted"));
    assert.equal(deleted.filters.status, "deleted");
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
