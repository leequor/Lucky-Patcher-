import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  escapeJobSearch,
  parseJobListParams,
} from "../app/lib/job-query.mjs";

describe("job list query", () => {
  it("parses and trims list filters", () => {
    const params = new URLSearchParams({
      page: "2",
      pageSize: "20",
      search: " Developer ",
      status: "deleted",
    });
    assert.deepEqual(parseJobListParams(params), {
      filters: { search: "Developer", status: "deleted", page: 2, pageSize: 20 },
    });
  });

  it("rejects invalid pagination and status", () => {
    assert.equal(
      parseJobListParams(new URLSearchParams({ page: "0" })).error,
      "Page must be a positive integer.",
    );
    assert.equal(
      parseJobListParams(new URLSearchParams({ status: "archived" })).error,
      "Status must be active or deleted.",
    );
  });

  it("escapes wildcard characters", () => {
    assert.equal(escapeJobSearch("DEV*100%"), "DEV\\*100\\%");
  });
});
