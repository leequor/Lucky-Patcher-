import { authorizeCustomerView } from "../../lib/customer-access";
import { escapeCustomerSearch, parseCustomerListParams } from "../../lib/customer-query.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const authorization = await authorizeCustomerView(request);
  if (authorization.response) {
    return authorization.response;
  }

  const parsed = parseCustomerListParams(new URL(request.url).searchParams);
  if (parsed.error) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { search, status, payTerms, page, pageSize } = parsed.filters;
  const firstRow = (page - 1) * pageSize;
  if (!Number.isSafeInteger(firstRow) || !Number.isSafeInteger(firstRow + pageSize - 1)) {
    return Response.json({ error: "The requested page is outside the supported range." }, { status: 400 });
  }

  let query = authorization.supabase
    .from("customers")
    .select("id, code, name, contact, pay_terms, status", { count: "exact" })
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .range(firstRow, firstRow + pageSize - 1);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (payTerms) {
    query = query.ilike("pay_terms", payTerms);
  }

  const safeSearch = escapeCustomerSearch(search);
  if (safeSearch) {
    const pattern = `*${safeSearch}*`;
    query = query.or(
      `code.ilike.${pattern},name.ilike.${pattern},contact.ilike.${pattern}`,
    );
  }

  try {
    const { data, error, count } = await query;
    if (error) {
      console.error("Could not load customer records.", error);
      return Response.json(
        { error: "Customers could not be loaded. Please try again." },
        { status: 500 },
      );
    }

    return Response.json({
      customers: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Could not reach Supabase while loading customers.", error);
    return Response.json(
      { error: "Customers could not be loaded. Check your connection and try again." },
      { status: 502 },
    );
  }
}
