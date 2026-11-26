import { authorizeDepartmentRight } from "../../lib/department-access";
import {
  escapeDepartmentSearch,
  parseDepartmentListParams,
} from "../../lib/department-query.mjs";
import { validateDepartmentInput } from "../../lib/department-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const parsed = parseDepartmentListParams(new URL(request.url).searchParams);
  if (parsed.error) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { search, status, page, pageSize } = parsed.filters;
  const authorization = await authorizeDepartmentRight(
    request,
    status === "deleted" ? "restore" : "view",
  );
  if (authorization.response) return authorization.response;

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

  const table = status === "active" ? "department_active" : "department";
  let query = authorization.supabase
    .from(table)
    .select(
      "id:deptcode, code:deptcode, name:deptname, description, is_deleted, stamp",
      { count: "exact" },
    )
    .order("deptname", { ascending: true })
    .range(firstRow, firstRow + pageSize - 1);

  if (status === "deleted") query = query.eq("is_deleted", true);

  const safeSearch = escapeDepartmentSearch(search);
  if (safeSearch) {
    const pattern = `*${safeSearch}*`;
    query = query.or(
      `deptcode.ilike.${pattern},deptname.ilike.${pattern},description.ilike.${pattern}`,
    );
  }

  try {
    const { data, error, count } = await query;
    if (error) {
      console.error("Could not load department records.", error);
      return Response.json(
        { error: "Departments could not be loaded. Please try again." },
        { status: 500 },
      );
    }

    return Response.json({
      departments: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Could not reach Supabase while loading departments.", error);
    return Response.json(
      { error: "Departments could not be loaded. Check your connection and try again." },
      { status: 502 },
    );
  }
}

export async function POST(request) {
  const authorization = await authorizeDepartmentRight(request, "add");
  if (authorization.response) return authorization.response;

  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Submit valid department details." }, { status: 400 });
  }

  const validation = validateDepartmentInput(input);
  if (validation.errors) {
    return Response.json(
      { error: "Check the highlighted department fields.", errors: validation.errors },
      { status: 422 },
    );
  }

  try {
    const { data, error } = await authorization.supabase
      .from("department")
      .insert({
        deptcode: validation.value.code,
        deptname: validation.value.name,
        description: validation.value.description,
      })
      .select(
        "id:deptcode, code:deptcode, name:deptname, description, is_deleted, stamp",
      )
      .single();

    if (error?.code === "23505") {
      return Response.json(
        {
          error: "A department with this code already exists.",
          errors: { code: "This code is already in use." },
        },
        { status: 409 },
      );
    }
    if (error) {
      console.error("Could not create department.", error);
      return Response.json(
        { error: "Department could not be created." },
        { status: 500 },
      );
    }

    return Response.json({ department: data }, { status: 201 });
  } catch (error) {
    console.error("Could not reach Supabase while creating a department.", error);
    return Response.json(
      { error: "Department could not be created. Check your connection and try again." },
      { status: 502 },
    );
  }
}
