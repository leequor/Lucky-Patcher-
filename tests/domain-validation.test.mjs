import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  normalizeCode,
  parseMoneyInput,
  validateCustomer,
  validatePrice,
  validateProduct,
  validateRegistration,
} from "../lib/domain/validation.js";

const validCustomer = {
  code: "CUS-2001",
  name: "Northwind Traders",
  contactPerson: "Elena Reyes",
  email: "elena@northwind.ph",
  phone: "+63 917 204 1188",
  address: "12 Mabini Ave",
  payTerms: "NET_30",
  status: "active",
  notes: "",
};

describe("Customer validation", () => {
  it("accepts a complete record", () => {
    assert.equal(validateCustomer(validCustomer).ok, true);
  });

  it("requires a code and a name", () => {
    const result = validateCustomer({ ...validCustomer, code: "  ", name: "" });
    assert.equal(result.ok, false);
    assert.ok(result.errors.code);
    assert.ok(result.errors.name);
  });

  it("rejects a code with invalid characters", () => {
    const result = validateCustomer({ ...validCustomer, code: "CUS 2001/!" });
    assert.equal(result.ok, false);
    assert.match(result.errors.code, /letters, numbers and dashes/i);
  });

  it("rejects a duplicate code, case-insensitively", () => {
    const result = validateCustomer(validCustomer, {
      codeExists: (code) => normalizeCode(code) === "CUS-2001",
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.code, /already in use/i);
  });

  it("restricts payment terms to the allowed list", () => {
    const result = validateCustomer({ ...validCustomer, payTerms: "NET_90" });
    assert.equal(result.ok, false);
    assert.ok(result.errors.payTerms);
  });

  it("rejects a malformed email but allows an empty one", () => {
    assert.equal(validateCustomer({ ...validCustomer, email: "not-an-email" }).ok, false);
    assert.equal(validateCustomer({ ...validCustomer, email: "" }).ok, true);
  });

  it("only accepts active or inactive status", () => {
    assert.equal(validateCustomer({ ...validCustomer, status: "archived" }).ok, false);
  });
});

describe("Product validation", () => {
  const validProduct = {
    code: "PRD-3001",
    description: "Galvanised steel sheet",
    unit: "PC",
    status: "active",
    notes: "",
  };

  it("accepts a complete record", () => {
    assert.equal(validateProduct(validProduct).ok, true);
  });

  it("restricts the unit to the allowed list", () => {
    const result = validateProduct({ ...validProduct, unit: "PALLET" });
    assert.equal(result.ok, false);
    assert.ok(result.errors.unit);
  });

  it("rejects a duplicate product code", () => {
    const result = validateProduct(validProduct, { codeExists: () => true });
    assert.equal(result.ok, false);
    assert.match(result.errors.code, /already in use/i);
  });

  it("requires a description", () => {
    assert.equal(validateProduct({ ...validProduct, description: " " }).ok, false);
  });
});

describe("Price validation", () => {
  const prices = [
    { id: "p1", effectiveDate: "2026-01-01", amount: 100, isDeleted: false },
    { id: "p2", effectiveDate: "2026-06-01", amount: 120, isDeleted: false },
  ];

  it("accepts an amount and a fresh date", () => {
    const result = validatePrice({ amount: "135.50", effectiveDate: "2026-09-01" }, { prices });
    assert.equal(result.ok, true);
  });

  it("rejects a zero or negative amount", () => {
    assert.equal(validatePrice({ amount: "0", effectiveDate: "2026-09-01" }).ok, false);
    assert.equal(validatePrice({ amount: "-5", effectiveDate: "2026-09-01" }).ok, false);
  });

  it("rejects more than two decimal places", () => {
    const result = validatePrice({ amount: "12.345", effectiveDate: "2026-09-01" });
    assert.equal(result.ok, false);
    assert.match(result.errors.amount, /two decimal places/i);
  });

  it("rejects a duplicate effective date for the same product", () => {
    const result = validatePrice({ amount: "99", effectiveDate: "2026-06-01" }, { prices });
    assert.equal(result.ok, false);
    assert.match(result.errors.effectiveDate, /already effective/i);
  });

  it("allows the same date when editing that same row", () => {
    const result = validatePrice(
      { amount: "130", effectiveDate: "2026-06-01" },
      { prices, priceId: "p2" },
    );
    assert.equal(result.ok, true);
  });

  it("rejects an invalid date", () => {
    assert.equal(validatePrice({ amount: "10", effectiveDate: "2026-02-31" }).ok, false);
    assert.equal(validatePrice({ amount: "10", effectiveDate: "06/01/2026" }).ok, false);
  });
});

describe("Money and registration helpers", () => {
  it("parses amounts with a currency symbol or separators", () => {
    assert.equal(parseMoneyInput("₱1,250.75"), 1250.75);
    assert.equal(parseMoneyInput("  335 "), 335);
    assert.ok(Number.isNaN(parseMoneyInput("")));
  });

  it("normalises codes to upper case", () => {
    assert.equal(normalizeCode(" cus-1001 "), "CUS-1001");
  });

  it("requires a matching confirmation password", () => {
    const result = validateRegistration({
      name: "Ada Villanueva",
      email: "ada@hopeinc.demo",
      password: "secret1",
      confirmPassword: "secret2",
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.confirmPassword);
  });
});
