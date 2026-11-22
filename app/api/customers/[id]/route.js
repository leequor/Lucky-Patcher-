
import { authorizeCustomerRight } from "../../../lib/customer-access";
import { runCustomerLifecycleAction } from "../../../lib/customer-lifecycle.mjs";
import { validateCustomerInput } from "../../../lib/customer-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const authorization = await authorizeCustomerRight(request, "edit");

  if (authorization.response) {
    return authorization.response;
  }

  const { id } = await params;

  if (!id || id.length > 100) {
    return Response.json(
      { error: "Choose a valid customer to update." },
      { status: 400 },
    );
  }

  let input;

  try {
    input = await request.json();
  } catch {
    return Response.json(
      { error: "Submit valid customer details." },
      { status: 400 },
    );
  }

  const validation = validateCustomerInput(input);

  if (validation.errors) {
    return Response.json(
      {
        error: "Check the highlighted customer fields.",
        errors: validation.errors,
      },
      { status: 422 },
    );
  }

  try {
    const { data, error } = await authorization.supabase
      .from("customer")
      .update({
        custno: validation.value.code,
        custname: validation.value.name,
        address: validation.value.address,
        payterm: validation.value.pay_terms,
      })
      .eq("custno", id)
      .select(
        "id:custno, code:custno, name:custname, address, pay_terms:payterm, is_deleted, stamp",
      )
      .maybeSingle();

    if (error?.code === "23505") {
      return Response.json(
        {
          error: "A customer with this code already exists.",
          errors: { code: "This code is already in use." },
        },
        { status: 409 },
      );
    }

    if (error) {
      console.error("Could not update customer.", error);
      return Response.json(
        { error: "Customer could not be updated." },
        { status: 500 },
      );
    }

    if (!data) {
      return Response.json(
        { error: "Customer was not found or is not available." },
        { status: 404 },
      );
    }

    return Response.json({ customer: data });
  } catch (error) {
    console.error("Could not reach Supabase while updating a customer.", error);

    return Response.json(
      {
        error: "Customer could not be updated. Check your connection and try again.",
      },
      { status: 502 },
    );
  }
}

export async function DELETE(request, { params }) {
  const authorization = await authorizeCustomerRight(request, "delete");

  if (authorization.response) {
    return authorization.response;
  }

  const { id } = await params;

  if (!id || id.length > 100) {
    return Response.json(
      { error: "Choose a valid customer to delete." },
      { status: 400 },
    );
  }

  return runCustomerLifecycleAction(authorization.supabase, "delete", id);
}
