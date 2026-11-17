import { authorizeCustomerRight } from "../../lib/customer-access";
import { escapeCustomerSearch, parseCustomerListParams } from "../../lib/customer-query.mjs";
import { validateCustomerInput } from "../../lib/customer-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const parsed = parseCustomerListParams(new URL(request.url).searchParams);
  if (parsed.error) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { search, status, payTerms, page, pageSize } = parsed.filters;
  const authorization = await authorizeCustomerRight(
    request,
    status === "deleted" ? "restore" : "view",
  );
  if (authorization.response) {
    return authorization.response;
  }

  const firstRow = (page - 1) * pageSize;
  if (!Number.isSafeInteger(firstRow) || !Number.isSafeInteger(firstRow + pageSize - 1)) {
    return Response.json({ error: "The requested page is outside the supported range." }, { status: 400 });
  }

  let query = authorization.supabase
    .from("customers")
    .select("id, code, name, contact, pay_terms, status, deleted_at", { count: "exact" });

  query =
    status === "deleted"
      ? query.not("deleted_at", "is", null)
      : query.is("deleted_at", null);

  query = query
    .order("name", { ascending: true })
    .range(firstRow, firstRow + pageSize - 1);

  if (status !== "all" && status !== "deleted") {
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

export async function POST(request) {
  const authorization = await authorizeCustomerRight(request, "add");
  if (authorization.response) {
    return authorization.response;
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Submit valid customer details." }, { status: 400 });
  }

  const validation = validateCustomerInput(input);
  if (validation.errors) {
    return Response.json(
      { error: "Check the highlighted customer fields.", errors: validation.errors },
      { status: 422 },
    );
  }

  try {
    const { data, error } = await authorization.supabase
      .from("customers")
      .insert(validation.value)
      .select("id, code, name, contact, pay_terms, status")
      .single();

    if (error?.code === "23505") {
      return Response.json(
        { error: "A customer with this code already exists.", errors: { code: "This code is already in use." } },
        { status: 409 },
      );
    }
    if (error) {
      console.error("Could not create customer.", error);
      return Response.json({ error: "Customer could not be created." }, { status: 500 });
    }

    return Response.json({ customer: data }, { status: 201 });
  } catch (error) {
    console.error("Could not reach Supabase while creating a customer.", error);
    return Response.json(
      { error: "Customer could not be created. Check your connection and try again." },
      { status: 502 },
    );
  }
}
