import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runCustomerLifecycleAction } from "../app/lib/customer-lifecycle.mjs";

describe("customer lifecycle actions", () => {
  it("uses the soft-delete RPC and reports active-child conflicts", async () => {
    let rpcName;
    let rpcArgs;
    const supabase = {
      async rpc(name, args) {
        rpcName = name;
        rpcArgs = args;
        return { data: { success: false, code: "active_children" }, error: null };
      },
    };

    const response = await runCustomerLifecycleAction(supabase, "delete", "customer-1");

    assert.equal(rpcName, "soft_delete_customer");
    assert.deepEqual(rpcArgs, { p_customer_id: "customer-1" });
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /active child records/);
  });

  it("calls the restore RPC and returns success only when it confirms", async () => {
    const supabase = {
      async rpc(name, args) {
        assert.equal(name, "restore_customer");
        assert.deepEqual(args, { p_customer_id: "customer-2" });
        return {
          data: { success: true, customer: { id: "customer-2" } },
          error: null,
        };
      },
    };

    const response = await runCustomerLifecycleAction(supabase, "restore", "customer-2");

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      customer: { id: "customer-2" },
    });
  });
});
