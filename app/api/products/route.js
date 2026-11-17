import { authorizeProductView } from "../../lib/product-access";
import {
  escapeSearchPattern,
  parseProductListParams,
} from "../../lib/product-query.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const parsed = parseProductListParams(new URL(request.url).searchParams);
  if (parsed.error) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const authorization = await authorizeProductView(request);
  if (authorization.response) {
    return authorization.response;
  }

  const { search, unit, status, page, pageSize } = parsed.filters;
  const firstRow = (page - 1) * pageSize;
  if (!Number.isSafeInteger(firstRow) || !Number.isSafeInteger(firstRow + pageSize - 1)) {
    return Response.json(
      { error: "The requested page is outside the supported range." },
      { status: 400 },
    );
  }

  let query = authorization.supabase
    .from("products_active")
    .select("id, code, description, unit, current_price, status", { count: "exact" })
    .order("description", { ascending: true })
    .range(firstRow, firstRow + pageSize - 1);

  if (status !== "all") {
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
