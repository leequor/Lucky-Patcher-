import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseProductListParams } from "../app/lib/product-query.mjs";
import {
  PRODUCT_UNITS,
  validateProductInput,
} from "../app/lib/product-validation.mjs";

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
        current_price: "12.50",
        status: " ACTIVE ",
      });

      assert.deepEqual(result, {
        value: {
          code: "P-001",
          description: "Widget",
          unit: "each",
          current_price: 12.5,
          status: "active",
        },
      });
    });

    it("requires the core fields and rejects unsupported units and statuses", () => {
      const result = validateProductInput({
        code: "",
        description: "",
        unit: "pallet",
        status: "deleted",
      });

      assert.equal(result.errors.code, "Product code is required.");
      assert.equal(result.errors.description, "Product description is required.");
      assert.equal(result.errors.unit, "Choose one of the allowed units.");
      assert.equal(result.errors.status, "Choose Active or Inactive.");
    });

    it("rejects invalid prices and field-length limits", () => {
      const result = validateProductInput({
        code: "C".repeat(21),
        description: "D".repeat(201),
        unit: PRODUCT_UNITS[0],
        current_price: "-1.00",
        status: "active",
      });

      assert.equal(result.errors.code, "Product code must be 20 characters or fewer.");
      assert.equal(
        result.errors.description,
        "Product description must be 200 characters or fewer.",
      );
      assert.equal(
        result.errors.current_price,
        "Enter a valid price with at most two decimal places.",
      );
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
