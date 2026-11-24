
import { authorizeProductRight } from "../../lib/product-access";
import {
  escapeSearchPattern,
  parseProductListParams,
} from "../../lib/product-query.mjs";
import { validateProductInput } from "../../lib/product-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatProduct(product, currentPrice = null) {
  return {
    ...product,
    current_price: currentPrice,
    status: product.is_deleted ? "Deleted" : "Active",
    deleted_at: product.is_deleted ? true : null,
  };
}

export async function GET(request) {
  const parsed = parseProductListParams(new URL(request.url).searchParams);

  if (parsed.error) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { search, unit, status, page, pageSize } = parsed.filters;

  const authorization = await authorizeProductRight(
    request,
    status === "deleted" ? "restore" : "view",
  );
  if (authorization.response) {
    return authorization.response;
  }

  const firstRow = (page - 1) * pageSize;

  if (
    !Number.isSafeInteger(firstRow) ||
    !Number.isSafeInteger(firstRow + pageSize - 1)
  ) {
    return Response.json(
      { error: "The requested page is outside the supported range." },
      { status: 400 },
    );
  }

  const table = status === "active" ? "product_active" : "product";

  let query = authorization.supabase
    .from(table)
    .select(
      "id:prodcode, code:prodcode, description, unit, is_deleted, stamp",
      { count: "exact" },
    )
    .order("description", { ascending: true })
    .range(firstRow, firstRow + pageSize - 1);

  if (status === "deleted") {
    query = query.eq("is_deleted", true);
  }

  if (unit) {
    query = query.ilike("unit", unit);
  }

  if (search) {
    const pattern = escapeSearchPattern(search);

    query = query.or(
      `prodcode.ilike.${pattern},description.ilike.${pattern}`,
    );
  }

  try {
    const { data, error, count } = await query;

    if (error) {
      console.error("Could not load product records.", error);

      return Response.json(
        { error: "Products could not be loaded. Please try again." },
        { status: 500 },
      );
    }

    const productCodes = (data || []).map((product) => product.code);
    const currentPrices = new Map();

    if (productCodes.length > 0) {
      const { data: priceRows, error: priceError } = await authorization.supabase
        .from("product_current_price")
        .select("prodcode, unitprice")
        .in("prodcode", productCodes)

      if (priceError) {
        console.error("Could not load product prices.", priceError);

        return Response.json(
          { error: "Product prices could not be loaded. Please try again." },
          { status: 500 },
        );
      }

      for (const price of priceRows || []) {
        currentPrices.set(price.prodcode, price.unitprice);
      }
    }

    const products = (data || []).map((product) =>
      formatProduct(product, currentPrices.get(product.code) ?? null),
    );

    return Response.json({
      products,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Could not reach Supabase while loading products.", error);

    return Response.json(
      { error: "Products could not be loaded. Check your connection and try again." },
      { status: 502 },
    );
  }
}

export async function POST(request) {
  const authorization = await authorizeProductRight(request, "add");

  if (authorization.response) {
    return authorization.response;
  }

  let input;

  try {
    input = await request.json();
  } catch {
    return Response.json(
      { error: "Submit valid product details." },
      { status: 400 },
    );
  }

  const validation = validateProductInput(input);

  if (validation.errors) {
    return Response.json(
      { error: "Check the highlighted product fields.", errors: validation.errors },
      { status: 422 },
    );
  }

  try {
    const { data, error } = await authorization.supabase
      .from("product")
      .insert({
        prodcode: validation.value.code,
        description: validation.value.description,
        unit: validation.value.unit,
        is_deleted: false,
      })
      .select("id:prodcode, code:prodcode, description, unit, is_deleted, stamp")
      .single();

    if (error?.code === "23505") {
      return Response.json(
        {
          error: "A product with this code already exists.",
          errors: { code: "This code is already in use." },
        },
        { status: 409 },
      );
    }

    if (error) {
      console.error("Could not create product.", error);

      return Response.json(
        { error: "Product could not be created." },
        { status: 500 },
      );
    }

    return Response.json({ product: formatProduct(data) }, { status: 201 });
  } catch (error) {
    console.error("Could not reach Supabase while creating a product.", error);

    return Response.json(
      { error: "Product could not be created. Check your connection and try again." },
      { status: 502 },
    );
  }
}
