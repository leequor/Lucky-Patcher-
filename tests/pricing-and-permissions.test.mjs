import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  nextScheduledPrice,
  priceAsOf,
  priceDelta,
  sortPricesDescending,
  upcomingPrices,
} from "../lib/domain/pricing.js";
import { can, permissionsForRole } from "../lib/domain/permissions.js";
import { PERMISSIONS } from "../lib/domain/constants.js";

const prices = [
  { id: "a", effectiveDate: "2024-11-05", amount: 285 },
  { id: "b", effectiveDate: "2025-08-20", amount: 310 },
  { id: "c", effectiveDate: "2026-09-01", amount: 335 },
];

describe("Current price resolution", () => {
  it("returns the newest price on or before the date", () => {
    assert.equal(priceAsOf(prices, "2026-11-13").id, "c");
    assert.equal(priceAsOf(prices, "2026-09-01").id, "c");
  });

  it("returns the older price for a date between two entries", () => {
    assert.equal(priceAsOf(prices, "2025-12-31").id, "b");
    assert.equal(priceAsOf(prices, "2026-08-31").id, "b");
  });

  it("returns nothing before the first price", () => {
    assert.equal(priceAsOf(prices, "2024-01-01"), null);
  });

  it("returns nothing for a product with no prices", () => {
    assert.equal(priceAsOf([], "2026-11-13"), null);
  });

  it("ignores a scheduled price until its date arrives", () => {
    const withFuture = [...prices, { id: "d", effectiveDate: "2026-12-01", amount: 360 }];
    assert.equal(priceAsOf(withFuture, "2026-11-13").id, "c");
    assert.equal(priceAsOf(withFuture, "2026-12-01").id, "d");
  });

  it("lists upcoming prices separately", () => {
    const withFuture = [...prices, { id: "d", effectiveDate: "2026-12-01", amount: 360 }];
    assert.deepEqual(
      upcomingPrices(withFuture, "2026-11-13").map((row) => row.id),
      ["d"],
    );
    assert.equal(nextScheduledPrice(withFuture, "2026-11-13").id, "d");
    assert.equal(nextScheduledPrice(prices, "2026-11-13"), null);
  });

  it("sorts newest first", () => {
    assert.deepEqual(
      sortPricesDescending(prices).map((row) => row.id),
      ["c", "b", "a"],
    );
  });
});

describe("Price deltas", () => {
  it("compares against the previous dated entry", () => {
    const delta = priceDelta(prices, prices[2]);
    assert.equal(delta.amount, 25);
    assert.equal(Math.round(delta.percent * 10) / 10, 8.1);
    assert.equal(delta.previousDate, "2025-08-20");
  });

  it("returns null for the first price", () => {
    assert.equal(priceDelta(prices, prices[0]), null);
  });
});

describe("Permission matrix", () => {
  it("gives superadmin every right", () => {
    Object.values(PERMISSIONS).forEach((permission) => {
      assert.equal(can("superadmin", permission), true, permission);
    });
  });

  it("keeps staff read-only", () => {
    assert.equal(can("user", PERMISSIONS.CUSTOMER_VIEW), true);
    assert.equal(can("user", PERMISSIONS.PRODUCT_VIEW), true);
    assert.equal(can("user", PERMISSIONS.CUSTOMER_CREATE), false);
    assert.equal(can("user", PERMISSIONS.CUSTOMER_EDIT), false);
    assert.equal(can("user", PERMISSIONS.CUSTOMER_DELETE), false);
    assert.equal(can("user", PERMISSIONS.PRICE_CREATE), false);
    assert.equal(can("user", PERMISSIONS.AUDIT_VIEW), false);
  });

  it("gives admin the records modules but not the activity log", () => {
    assert.equal(can("admin", PERMISSIONS.CUSTOMER_DELETE), true);
    assert.equal(can("admin", PERMISSIONS.PRICE_EDIT), true);
    assert.equal(can("admin", PERMISSIONS.AUDIT_VIEW), false);
  });

  it("returns no rights for an unknown role", () => {
    assert.deepEqual(permissionsForRole("ghost"), []);
    assert.equal(can("ghost", PERMISSIONS.CUSTOMER_VIEW), false);
  });
});
