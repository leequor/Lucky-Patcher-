import { authorizeJobRight } from "../../lib/job-access";
import { escapeJobSearch, parseJobListParams } from "../../lib/job-query.mjs";
import { validateJobInput } from "../../lib/job-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const parsed = parseJobListParams(new URL(request.url).searchParams);
  if (parsed.error) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { search, status, page, pageSize } = parsed.filters;
  const authorization = await authorizeJobRight(
    request,
    status === "deleted" ? "restore" : "view",
  );
  if (authorization.response) return authorization.response;

  const firstRow = (page - 1) * pageSize;
  if (!Number.isSafeInteger(firstRow) || !Number.isSafeInteger(firstRow + pageSize - 1)) {
    return Response.json(
      { error: "The requested page is outside the supported range." },
      { status: 400 },
    );
  }

  const table = status === "active" ? "job_active" : "job";
  let query = authorization.supabase
    .from(table)
    .select("id:jobcode, code:jobcode, title:jobtitle, description, is_deleted, stamp", {
      count: "exact",
    })
    .order("jobtitle", { ascending: true })
    .range(firstRow, firstRow + pageSize - 1);

  if (status === "deleted") query = query.eq("is_deleted", true);

  const safeSearch = escapeJobSearch(search);
  if (safeSearch) {
    const pattern = `*${safeSearch}*`;
    query = query.or(
      `jobcode.ilike.${pattern},jobtitle.ilike.${pattern},description.ilike.${pattern}`,
    );
  }

  try {
    const { data, error, count } = await query;
    if (error) {
      console.error("Could not load job records.", error);
      return Response.json(
        { error: "Jobs could not be loaded. Please try again." },
        { status: 500 },
      );
    }
    return Response.json({
      jobs: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Could not reach Supabase while loading jobs.", error);
    return Response.json(
      { error: "Jobs could not be loaded. Check your connection and try again." },
      { status: 502 },
    );
  }
}

export async function POST(request) {
  const authorization = await authorizeJobRight(request, "add");
  if (authorization.response) return authorization.response;

  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Submit valid job details." }, { status: 400 });
  }

  const validation = validateJobInput(input);
  if (validation.errors) {
    return Response.json(
      { error: "Check the highlighted job fields.", errors: validation.errors },
      { status: 422 },
    );
  }

  try {
    const { data, error } = await authorization.supabase
      .from("job")
      .insert({
        jobcode: validation.value.code,
        jobtitle: validation.value.title,
        description: validation.value.description,
      })
      .select("id:jobcode, code:jobcode, title:jobtitle, description, is_deleted, stamp")
      .single();

    if (error?.code === "23505") {
      return Response.json(
        {
          error: "A job with this code already exists.",
          errors: { code: "This code is already in use." },
        },
        { status: 409 },
      );
    }
    if (error) {
      console.error("Could not create job.", error);
      return Response.json({ error: "Job could not be created." }, { status: 500 });
    }
    return Response.json({ job: data }, { status: 201 });
  } catch (error) {
    console.error("Could not reach Supabase while creating a job.", error);
    return Response.json(
      { error: "Job could not be created. Check your connection and try again." },
      { status: 502 },
    );
  }
}
