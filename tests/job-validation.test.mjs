import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateJobInput } from "../app/lib/job-validation.mjs";

describe("job form validation", () => {
  it("normalizes a valid job", () => {
    assert.deepEqual(
      validateJobInput({
        code: " dev ",
        title: " Software Developer ",
        description: " Builds and maintains applications ",
      }),
      {
        value: {
          code: "DEV",
          title: "Software Developer",
          description: "Builds and maintains applications",
        },
      },
    );
  });

  it("requires code and title", () => {
    const result = validateJobInput({ code: " ", title: "" });
    assert.equal(result.errors.code, "Job code is required.");
    assert.equal(result.errors.title, "Job title is required.");
  });

  it("rejects fields over their limits", () => {
    const result = validateJobInput({
      code: "C".repeat(21),
      title: "T".repeat(101),
      description: "D".repeat(501),
    });
    assert.equal(result.errors.code, "Job code must be 20 characters or fewer.");
    assert.equal(result.errors.title, "Job title must be 100 characters or fewer.");
    assert.equal(result.errors.description, "Description must be 500 characters or fewer.");
  });

  it("rejects non-text description values", () => {
    const result = validateJobInput({
      code: "DEV",
      title: "Software Developer",
      description: 100,
    });
    assert.equal(result.errors.description, "Enter a valid description.");
  });
});
