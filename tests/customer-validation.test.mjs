import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOMER_PAY_TERMS,
  validateCustomerInput,
} from "../app/lib/customer-validation.mjs";

describe("customer form validation", () => {
  it("normalizes valid customer fields for storage", () => {
    const result = validateCustomerInput({
      code: " C-001 ",
      name: " Acme Inc. ",
      contact: " 555-0100 ",
      pay_terms: CUSTOMER_PAY_TERMS[0],
    });

    assert.deepEqual(result, {
      value: {
        code: "C-001",
        name: "Acme Inc.",
        contact: "555-0100",
        pay_terms: "Net 30",
      },
    });
  });

  it("requires code and name and rejects unsupported pay terms", () => {
    const result = validateCustomerInput({
      code: " ",
      name: "",
      pay_terms: "Net 45",
    });

    assert.equal(result.errors.code, "Customer code is required.");
    assert.equal(result.errors.name, "Customer name is required.");
    assert.equal(result.errors.pay_terms, "Choose one of the listed payment terms.");
  });

  it("rejects non-text optional fields instead of silently clearing them", () => {
    const result = validateCustomerInput({
      code: "C-001",
      name: "Acme Inc.",
      contact: 123,
      pay_terms: 30,
    });

    assert.equal(result.errors.contact, "Enter a valid contact.");
    assert.equal(result.errors.pay_terms, "Choose one of the listed payment terms.");
  });

  it("enforces the documented field-length limits", () => {
    const result = validateCustomerInput({
      code: "C".repeat(11),
      name: "N".repeat(101),
      contact: "1".repeat(201),
    });

    assert.equal(result.errors.code, "Customer code must be 10 characters or fewer.");
    assert.equal(result.errors.name, "Customer name must be 100 characters or fewer.");
    assert.equal(result.errors.contact, "Contact must be 200 characters or fewer.");
  });
});
