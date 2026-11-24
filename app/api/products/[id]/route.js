import { authorizeProductRight } from "../../../lib/product-access";
import { runProductLifecycleAction } from "../../../lib/product-lifecycle.mjs";
import { validateProductInput } from "../../../lib/product-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const authorization = await authorizeProductRight(request, "edit");
  if (authorization.response) {
    return authorization.response;
  }

  const { id } = await params;
  if (!id || id.length > 100) {
    return Response.json({ error: "Choose a valid product to update." }, { status: 400 });
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Submit valid product details." }, { status: 400 });
  }

  const validation = validateProductInput(input);
  if (validation.errors) {
    return Response.json(
      { error: "Check the highlighted product fields.", errors: validation.errors },
      { status: 422 },
    );
  }

  const update = { ...validation.value };
  delete update.current_price;

  try {
    const { data, error } = await authorization.supabase
      .from("products")
      .update(update)
      .eq("id", id)
      .select("id, code, description, unit, current_price, status")
      .maybeSingle();

    if (error?.code === "23505") {
      return Response.json(
        { error: "A product with this code already exists.", errors: { code: "This code is already in use." } },
        { status: 409 },
      );
    }
    if (error) {
      console.error("Could not update product.", error);
      return Response.json({ error: "Product could not be updated." }, { status: 500 });
    }
    if (!data) {
      return Response.json({ error: "Product was not found or is not available." }, { status: 404 });
    }

    return Response.json({ product: data });
  } catch (error) {
    console.error("Could not reach Supabase while updating a product.", error);
    return Response.json(
      { error: "Product could not be updated. Check your connection and try again." },
      { status: 502 },
    );
  }
}

export async function DELETE(request, { params }) {
  const authorization = await authorizeProductRight(request, "delete");
  if (authorization.response) {
    return authorization.response;
  }

  const { id } = await params;
  if (!id || id.length > 100) {
    return Response.json({ error: "Choose a valid product to delete." }, { status: 400 });
  }

  return runProductLifecycleAction(authorization.supabase, "delete", id);
}
