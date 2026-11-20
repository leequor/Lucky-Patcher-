import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runProductLifecycleAction } from "../app/lib/product-lifecycle.mjs";

describe("product lifecycle actions", () => {
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

    const response = await runProductLifecycleAction(supabase, "delete", "product-1");

    assert.equal(rpcName, "soft_delete_product");
    assert.deepEqual(rpcArgs, { p_product_id: "product-1" });
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /price history or sale details/);
  });

  it("calls the restore RPC and returns success only when it confirms", async () => {
    const supabase = {
      async rpc(name, args) {
        assert.equal(name, "restore_product");
        assert.deepEqual(args, { p_product_id: "product-2" });
        return {
          data: { success: true, product: { id: "product-2" } },
          error: null,
        };
      },
    };

    const response = await runProductLifecycleAction(supabase, "restore", "product-2");

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      product: { id: "product-2" },
    });
  });
});
