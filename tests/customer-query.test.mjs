import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOMER_MAX_PAGE_SIZE,
  CUSTOMER_PAGE_SIZE,
  escapeCustomerSearch,
  parseCustomerListParams,
} from "../app/lib/customer-query.mjs";

describe("customer list query parsing", () => {
  it("defaults to active customers and caps page size", () => {
    const result = parseCustomerListParams(
      new URLSearchParams("pageSize=500&search=%20C-01%20"),
    );

    assert.deepEqual(result, {
      filters: {
        search: "C-01",
        status: "active",
        payTerms: "",
        page: 1,
        pageSize: CUSTOMER_MAX_PAGE_SIZE,
      },
    });
    assert.equal(CUSTOMER_PAGE_SIZE, 20);
  });

  it("accepts status, payment-term, and pagination filters", () => {
    const result = parseCustomerListParams(
      new URLSearchParams("status=inactive&payTerms=Net%2030&page=3&pageSize=10"),
    );

    assert.deepEqual(result.filters, {
      search: "",
      status: "inactive",
      payTerms: "Net 30",
      page: 3,
      pageSize: 10,
    });
  });

  it("accepts the deleted-record filter", () => {
    const result = parseCustomerListParams(
      new URLSearchParams("status=deleted&page=2"),
    );

    assert.equal(result.filters.status, "deleted");
    assert.equal(result.filters.page, 2);
  });

  it("rejects invalid filters and malformed pagination", () => {
    assert.match(
      parseCustomerListParams(new URLSearchParams("status=archived")).error,
      /valid customer status/,
    );
    assert.match(
      parseCustomerListParams(new URLSearchParams("page=0")).error,
      /positive whole numbers/,
    );
  });

  it("quotes search text so reserved filter characters remain data", () => {
    assert.equal(escapeCustomerSearch('A,B "Co"'), '"*A,B \\"Co\\"*"');
  });
});
