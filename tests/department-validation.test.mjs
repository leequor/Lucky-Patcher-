import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateDepartmentInput } from "../app/lib/department-validation.mjs";

describe("department form validation", () => {
  it("normalizes a valid department", () => {
    assert.deepEqual(
      validateDepartmentInput({
        code: " hr ",
        name: " Human Resources ",
        description: " Employee operations ",
      }),
      {
        value: {
          code: "HR",
          name: "Human Resources",
          description: "Employee operations",
        },
      },
    );
  });

  it("requires code and name", () => {
    const result = validateDepartmentInput({ code: " ", name: "" });
    assert.equal(result.errors.code, "Department code is required.");
    assert.equal(result.errors.name, "Department name is required.");
  });

  it("rejects fields over their limits", () => {
    const result = validateDepartmentInput({
      code: "C".repeat(21),
      name: "N".repeat(101),
      description: "D".repeat(501),
    });
    assert.equal(result.errors.code, "Department code must be 20 characters or fewer.");
    assert.equal(result.errors.name, "Department name must be 100 characters or fewer.");
    assert.equal(result.errors.description, "Description must be 500 characters or fewer.");
  });

  it("rejects non-text description values", () => {
    const result = validateDepartmentInput({
      code: "HR",
      name: "Human Resources",
      description: 100,
    });
    assert.equal(result.errors.description, "Enter a valid description.");
  });
});
