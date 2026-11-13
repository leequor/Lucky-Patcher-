import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * The records store persists through localStorage. These tests run it against
 * an in-memory implementation of the same API, so the rules that protect the
 * data are exercised exactly as the browser runs them.
 */
class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
  key(index) {
    return [...this.map.keys()][index] ?? null;
  }
  get length() {
    return this.map.size;
  }
}

globalThis.window = { localStorage: new MemoryStorage() };

const store = await import("../lib/data/store.js");
const { resetWorkspace } = await import("../lib/data/storage.js");

const admin = { id: "usr_ada", name: "Ada Villanueva", email: "ada@hopeinc.demo", role: "superadmin" };
const staff = { id: "usr_rina", name: "Rina Delgado", email: "rina@hopeinc.demo", role: "user" };

const newCustomer = {
  code: "CUS-9001",
  name: "Test Trading",
  contactPerson: "Test Person",
  email: "test@trading.ph",
  phone: "+63 900 000 0000",
  address: "1 Test Street",
  payTerms: "NET_30",
  status: "active",
  notes: "",
};

beforeEach(async () => {
  await resetWorkspace();
});

describe("Seed workspace", () => {
  it("has internally consistent counts", async () => {
    const stats = await store.getWorkspaceStats();
    assert.equal(stats.activeCustomers, 10);
    assert.equal(stats.activeProducts, 11);
    assert.equal(stats.productsWithoutPrice, 1);
    assert.equal(stats.productsWithoutPriceList[0].code, "PRD-2009");
  });

  it("keeps codes unique", async () => {
    const customers = await store.listCustomers({ pageSize: 500, status: "all" });
    const deleted = await store.listCustomers({ pageSize: 500, status: "deleted" });
    const codes = [...customers.rows, ...deleted.rows].map((row) => row.code);
    assert.equal(new Set(codes).size, codes.length);
  });
});

describe("Customer list, search and filters", () => {
  it("finds a customer by code, name, contact and phone", async () => {
    for (const query of ["CUS-1001", "northwind", "Elena", "917 204"]) {
      const result = await store.listCustomers({ q: query });
      assert.equal(result.total, 1, query);
      assert.equal(result.rows[0].code, "CUS-1001", query);
    }
  });

  it("hides soft-deleted rows from the default list", async () => {
    const all = await store.listCustomers({ pageSize: 100 });
    assert.equal(all.rows.some((row) => row.code === "CUS-1012"), false);
  });

  it("filters by status and payment terms", async () => {
    const inactive = await store.listCustomers({ status: "inactive" });
    assert.equal(inactive.total, 1);
    assert.equal(inactive.rows[0].code, "CUS-1007");

    const cod = await store.listCustomers({ payTerms: "COD" });
    assert.equal(cod.total, 2);
    cod.rows.forEach((row) => assert.equal(row.payTerms, "COD"));
  });

  it("paginates without losing rows", async () => {
    const first = await store.listCustomers({ status: "active", pageSize: 5, page: 1 });
    const second = await store.listCustomers({ status: "active", pageSize: 5, page: 2 });
    assert.equal(first.rows.length, 5);
    assert.equal(second.rows.length, 5);
    assert.equal(first.pageCount, 2);
    const codes = new Set([...first.rows, ...second.rows].map((row) => row.code));
    assert.equal(codes.size, 10);
  });
});

describe("Customer writes", () => {
  it("creates a customer and records the actor", async () => {
    const created = await store.createCustomer(newCustomer, admin);
    assert.equal(created.code, "CUS-9001");

    const found = await store.getCustomer(created.id);
    assert.equal(found.name, "Test Trading");

    const activity = await store.listAuditFor("customer", created.id);
    assert.equal(activity.length, 1);
    assert.equal(activity[0].actorName, "Ada Villanueva");
    assert.equal(activity[0].action, "customer.create");
  });

  it("rejects a duplicate customer code", async () => {
    await assert.rejects(
      () => store.createCustomer({ ...newCustomer, code: "cus-1001" }, admin),
      (error) => {
        assert.equal(error.code, "validation");
        assert.match(error.errors.code, /already in use/i);
        return true;
      },
    );
  });

  it("rejects a write from a role without the right", async () => {
    await assert.rejects(
      () => store.createCustomer({ ...newCustomer, code: "CUS-9002" }, staff),
      (error) => {
        assert.equal(error.code, "forbidden");
        assert.equal(error.status, 403);
        return true;
      },
    );
  });

  it("updates a customer and logs the changed field", async () => {
    const before = await store.getCustomer("cus_1004");
    await store.updateCustomer(
      "cus_1004",
      { ...before, payTerms: "NET_60" },
      admin,
    );

    const after = await store.getCustomer("cus_1004");
    assert.equal(after.payTerms, "NET_60");

    const activity = await store.listAuditFor("customer", "cus_1004");
    assert.equal(activity[0].action, "customer.update");
    assert.match(activity[0].detail, /Net 60/);
  });

  it("soft deletes, hides and restores a customer", async () => {
    await store.deleteCustomer("cus_1001", admin);

    const deleted = await store.getCustomer("cus_1001");
    assert.equal(deleted.isDeleted, true);
    assert.ok(deleted.deletedAt);

    const active = await store.listCustomers({ pageSize: 100 });
    assert.equal(active.rows.some((row) => row.id === "cus_1001"), false);

    const recycle = await store.listCustomers({ status: "deleted", pageSize: 100 });
    assert.equal(recycle.rows.some((row) => row.id === "cus_1001"), true);

    await store.restoreCustomer("cus_1001", admin);
    const restored = await store.listCustomers({ pageSize: 100 });
    assert.equal(restored.rows.some((row) => row.id === "cus_1001"), true);

    const activity = await store.listAuditFor("customer", "cus_1001");
    assert.deepEqual(
      activity.map((entry) => entry.action),
      ["customer.restore", "customer.delete"],
    );
  });

  it("refuses to delete the same customer twice", async () => {
    await store.deleteCustomer("cus_1002", admin);
    await assert.rejects(
      () => store.deleteCustomer("cus_1002", admin),
      (error) => error.code === "already_deleted",
    );
  });
});

describe("Product and price rules", () => {
  it("shows the current price from the newest dated entry", async () => {
    const product = await store.getProduct("prd_2005");
    assert.equal(product.currentPrice.amount, 335);
    assert.equal(product.currentPrice.effectiveDate, "2026-09-01");
    assert.equal(product.priceCount, 3);
  });

  it("reports a product with no price instead of zero", async () => {
    const product = await store.getProduct("prd_2009");
    assert.equal(product.currentPrice, null);
    assert.equal(product.currentPriceMissing, true);
  });

  it("blocks deleting a product that still has price records", async () => {
    await assert.rejects(
      () => store.deleteProduct("prd_2005", admin),
      (error) => {
        assert.equal(error.code, "has_children");
        assert.match(error.message, /3 price records/i);
        return true;
      },
    );
  });

  it("allows deleting a product once its price records are gone", async () => {
    const prices = await store.listPrices("prd_2006");
    assert.equal(prices.length, 1);
    await store.deletePrice(prices[0].id, admin);
    await store.deleteProduct("prd_2006", admin);

    const product = await store.getProduct("prd_2006");
    assert.equal(product.isDeleted, true);
  });

  it("rejects a second price on the same effective date", async () => {
    await assert.rejects(
      () => store.addPrice("prd_2005", { amount: "340", effectiveDate: "2026-09-01" }, admin),
      (error) => {
        assert.equal(error.code, "validation");
        assert.match(error.errors.effectiveDate, /already effective/i);
        return true;
      },
    );
  });

  it("turns a newly added past price into the current price", async () => {
    await store.addPrice("prd_2005", { amount: "350", effectiveDate: "2026-11-01" }, admin);
    const product = await store.getProduct("prd_2005");
    assert.equal(product.currentPrice.amount, 350);
    assert.equal(product.currentPrice.effectiveDate, "2026-11-01");
  });

  it("keeps a future price out of the current price", async () => {
    await store.addPrice("prd_2005", { amount: "390", effectiveDate: "2026-12-01" }, admin);
    const product = await store.getProduct("prd_2005");
    assert.equal(product.currentPrice.amount, 335);
  });

  it("records every price change with the acting user", async () => {
    const price = await store.addPrice(
      "prd_2009",
      { amount: "880", effectiveDate: "2026-11-13" },
      admin,
    );
    assert.ok(price.id);

    const activity = await store.listAuditFor("product", "prd_2009");
    assert.equal(activity[0].action, "price.create");
    assert.equal(activity[0].actorName, "Ada Villanueva");
    assert.match(activity[0].detail, /₱880\.00/);
  });

  it("rejects price writes from staff", async () => {
    await assert.rejects(
      () => store.addPrice("prd_2005", { amount: "1", effectiveDate: "2026-11-12" }, staff),
      (error) => error.code === "forbidden",
    );
  });
});

describe("Audit log", () => {
  it("filters by record type and keeps newest first", async () => {
    await store.createCustomer({ ...newCustomer, code: "CUS-9100" }, admin);

    const customerEntries = await store.listAudit({ entity: "customer", pageSize: 50 });
    assert.ok(customerEntries.rows.every((row) => row.entity === "customer"));

    const dates = customerEntries.rows.map((row) => row.at);
    const sorted = [...dates].sort().reverse();
    assert.deepEqual(dates, sorted);
  });

});
