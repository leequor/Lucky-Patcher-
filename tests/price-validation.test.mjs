import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validatePriceInput } from "../app/lib/price-validation.mjs";

describe("validatePriceInput", () => {
  it("accepts a non-negative amount and a real ISO effective date", () => {
    assert.deepEqual(validatePriceInput({ amount: "12.50", effective_date: "2026-02-28" }), {
      value: { amount: "12.50", effective_date: "2026-02-28" },
    });
  });

  it("rejects amounts with too many decimals and impossible dates", () => {
    const result = validatePriceInput({ amount: "12.345", effective_date: "2026-02-30" });

    assert.match(result.errors.amount, /at most two decimal places/);
    assert.match(result.errors.effective_date, /valid effective date/);
  });

  it("rejects negative values and malformed dates", () => {
    const result = validatePriceInput({ amount: "-1.00", effective_date: "26-02-01" });

    assert.ok(result.errors.amount);
    assert.ok(result.errors.effective_date);
  });
});
