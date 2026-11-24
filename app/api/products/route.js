import {
  authorizeProductRight,
  authorizeProductView,
} from "../../lib/product-access";
import {
  escapeSearchPattern,
  parseProductListParams,
} from "../../lib/product-query.mjs";
import { validateProductInput } from "../../lib/product-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const parsed = parseProductListParams(new URL(request.url).searchParams);
  if (parsed.error) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { search, unit, status, page, pageSize } = parsed.filters;
  const authorization = await authorizeProductRight(request, status === "deleted" ? "restore" : "view");
  if (authorization.response) {
    return authorization.response;
  }

  const firstRow = (page - 1) * pageSize;
  if (!Number.isSafeInteger(firstRow) || !Number.isSafeInteger(firstRow + pageSize - 1)) {
    return Response.json(
      { error: "The requested page is outside the supported range." },
      { status: 400 },
    );
  }

  let query = authorization.supabase
    .from("products")
    .select("id, code, description, unit, current_price, status, deleted_at", { count: "exact" })
    .order("description", { ascending: true })
    .range(firstRow, firstRow + pageSize - 1);

  if (status === "deleted") {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }

  if (status !== "all" && status !== "deleted") {
    query = query.ilike("status", status);
  }
  if (unit) {
    query = query.eq("unit", unit);
  }

  if (search) {
    const pattern = escapeSearchPattern(search);
    query = query.or(`code.ilike.${pattern},description.ilike.${pattern}`);
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

    return Response.json({
      products: data || [],
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
    return Response.json({ error: "Submit valid product details." }, { status: 400 });
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
      .from("products")
      .insert(validation.value)
      .select("id, code, description, unit, current_price, status")
      .single();

    if (error?.code === "23505") {
      return Response.json(
        { error: "A product with this code already exists.", errors: { code: "This code is already in use." } },
        { status: 409 },
      );
    }
    if (error) {
      console.error("Could not create product.", error);
      return Response.json({ error: "Product could not be created." }, { status: 500 });
    }

    return Response.json({ product: data }, { status: 201 });
  } catch (error) {
    console.error("Could not reach Supabase while creating a product.", error);
    return Response.json(
      { error: "Product could not be created. Check your connection and try again." },
      { status: 502 },
    );
  }
}
