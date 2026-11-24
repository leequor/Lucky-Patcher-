import { authorizeProductPriceRight } from "../../../../../lib/product-access";
import {
  isValidEffectiveDate,
  validatePriceInput,
} from "../../../../../lib/price-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasValidIds(productId, priceId) {
  return (
    typeof productId === "string" &&
    productId.length > 0 &&
    productId.length <= 20 &&
    isValidEffectiveDate(priceId)
  );
}

function toPriceHistoryRow(row) {
  return {
    id: row.effdate,
    amount: row.unitprice,
    effective_date: row.effdate,
  };
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
      .from("pricehist")
      .update({
        unitprice: validation.value.amount,
        effdate: validation.value.effective_date,
      })
      .eq("prodcode", id)
      .eq("effdate", priceId)
      .eq("is_deleted", false)
      .select("prodcode, unitprice, effdate")
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

    return Response.json({ price: toPriceHistoryRow(data) });
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
      .from("pricehist")
      .update({ is_deleted: true })
      .eq("prodcode", id)
      .eq("effdate", priceId)
      .eq("is_deleted", false)
      .select("prodcode, unitprice, effdate")
      .maybeSingle();

    if (error) {
      console.error("Could not delete a product price.", error);
      return Response.json({ error: "Price could not be deleted." }, { status: 500 });
    }
    if (!data) {
      return Response.json({ error: "Price was not found for this product." }, { status: 404 });
    }

    return Response.json({ price: toPriceHistoryRow(data) });
  } catch (error) {
    console.error("Could not reach Supabase while deleting a product price.", error);
    return Response.json(
      { error: "Price could not be deleted. Check your connection and try again." },
      { status: 502 },
    );
  }
}
