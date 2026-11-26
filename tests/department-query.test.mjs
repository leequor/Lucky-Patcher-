import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  escapeDepartmentSearch,
  parseDepartmentListParams,
} from "../app/lib/department-query.mjs";

describe("department list query", () => {
  it("parses and trims list filters", () => {
    const params = new URLSearchParams({
      page: "2",
      pageSize: "20",
      search: " Human ",
      status: "deleted",
    });
    assert.deepEqual(parseDepartmentListParams(params), {
      filters: { search: "Human", status: "deleted", page: 2, pageSize: 20 },
    });
  });

  it("rejects invalid pagination and status", () => {
    assert.equal(
      parseDepartmentListParams(new URLSearchParams({ page: "0" })).error,
      "Page must be a positive integer.",
    );
    assert.equal(
      parseDepartmentListParams(new URLSearchParams({ status: "archived" })).error,
      "Status must be active or deleted.",
    );
  });

  it("escapes wildcard characters", () => {
    assert.equal(escapeDepartmentSearch("HR*100%"), "HR\\*100\\%");
  });
});
