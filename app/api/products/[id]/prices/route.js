import { authorizeProductPriceRight } from "../../../../lib/product-access";
import { validatePriceInput } from "../../../../lib/price-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidProductId(id) {
  return typeof id === "string" && id.length > 0 && id.length <= 20;
}

function toPriceHistoryRow(row) {
  return {
    id: row.effdate,
    amount: row.unitprice,
    effective_date: row.effdate,
  };
}

export async function GET(request, { params }) {
  const authorization = await authorizeProductPriceRight(request, "view");
  if (authorization.response) {
    return authorization.response;
  }

  const { id } = await params;
  if (!isValidProductId(id)) {
    return Response.json({ error: "Choose a valid product to view price history." }, { status: 400 });
  }

  try {
    const { data, error } = await authorization.supabase
      .from("pricehist")
      .select("prodcode, unitprice, effdate")
      .eq("prodcode", id)
      .eq("is_deleted", false)
      .order("effdate", { ascending: false });

    if (error) {
      console.error("Could not load product price history.", error);
      return Response.json(
        { error: "Price history could not be loaded. Please try again." },
        { status: 500 },
      );
    }

    return Response.json({ prices: (data || []).map(toPriceHistoryRow) });
  } catch (error) {
    console.error("Could not reach Supabase while loading product price history.", error);
    return Response.json(
      { error: "Price history could not be loaded. Check your connection and try again." },
      { status: 502 },
    );
  }
}

export async function POST(request, { params }) {
  const authorization = await authorizeProductPriceRight(request, "add");
  if (authorization.response) {
    return authorization.response;
  }

  const { id } = await params;
  if (!isValidProductId(id)) {
    return Response.json({ error: "Choose a valid product to add a price." }, { status: 400 });
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
      .insert({
        prodcode: id,
        unitprice: validation.value.amount,
        effdate: validation.value.effective_date,
        is_deleted: false,
      })
      .select("prodcode, unitprice, effdate")
      .single();

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
      console.error("Could not add a product price.", error);
      return Response.json({ error: "Price could not be added." }, { status: 500 });
    }

    return Response.json({ price: toPriceHistoryRow(data) }, { status: 201 });
  } catch (error) {
    console.error("Could not reach Supabase while adding a product price.", error);
    return Response.json(
      { error: "Price could not be added. Check your connection and try again." },
      { status: 502 },
    );
  }
}
