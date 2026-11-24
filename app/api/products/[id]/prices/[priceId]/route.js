import { authorizeProductPriceRight } from "../../../../../lib/product-access";
import { validatePriceInput } from "../../../../../lib/price-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasValidIds(productId, priceId) {
  return UUID_PATTERN.test(productId || "") && UUID_PATTERN.test(priceId || "");
}

export async function PATCH(request, { params }) {
  const authorization = await authorizeProductPriceRight(request, "edit");
  if (authorization.response) {
    return authorization.response;
  }

  const { id, priceId } = await params;
  if (!hasValidIds(id, priceId)) {
    return Response.json({ error: "Choose a valid price to update." }, { status: 400 });
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Submit a valid amount and effective date." }, { status: 400 });
  }

  const validation = validatePriceInput(input);
  if (validation.errors) {
    return Response.json(
      { error: "Check the highlighted price fields.", errors: validation.errors },
      { status: 422 },
    );
  }

  try {
    const { data, error } = await authorization.supabase
      .from("product_prices")
      .update(validation.value)
      .eq("product_id", id)
      .eq("id", priceId)
      .select("id, product_id, amount, effective_date, created_at")
      .maybeSingle();

    if (error?.code === "23505") {
      return Response.json(
        {
          error: "A price already exists for this product and effective date.",
          errors: { effective_date: "Choose a different effective date." },
        },
        { status: 409 },
      );
    }
    if (error) {
      console.error("Could not update a product price.", error);
      return Response.json({ error: "Price could not be updated." }, { status: 500 });
    }
    if (!data) {
      return Response.json({ error: "Price was not found for this product." }, { status: 404 });
    }

    return Response.json({ price: data });
  } catch (error) {
    console.error("Could not reach Supabase while updating a product price.", error);
    return Response.json(
      { error: "Price could not be updated. Check your connection and try again." },
      { status: 502 },
    );
  }
}

export async function DELETE(request, { params }) {
  const authorization = await authorizeProductPriceRight(request, "delete");
  if (authorization.response) {
    return authorization.response;
  }

  const { id, priceId } = await params;
  if (!hasValidIds(id, priceId)) {
    return Response.json({ error: "Choose a valid price to delete." }, { status: 400 });
  }

  try {
    const { data, error } = await authorization.supabase
      .from("product_prices")
      .delete()
      .eq("product_id", id)
      .eq("id", priceId)
      .select("id, product_id, amount, effective_date")
      .maybeSingle();

    if (error) {
      console.error("Could not delete a product price.", error);
      return Response.json({ error: "Price could not be deleted." }, { status: 500 });
    }
    if (!data) {
      return Response.json({ error: "Price was not found for this product." }, { status: 404 });
    }

    return Response.json({ price: data });
  } catch (error) {
    console.error("Could not reach Supabase while deleting a product price.", error);
    return Response.json(
      { error: "Price could not be deleted. Check your connection and try again." },
      { status: 502 },
    );
  }
}
