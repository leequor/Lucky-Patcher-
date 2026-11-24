import { authorizeProductRight } from "../../../../lib/product-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const authorization = await authorizeProductRight(request, "restore");
  if (authorization.response) {
    return authorization.response;
  }

  const { id } = await params;
  if (!id || id.length > 100) {
    return Response.json({ error: "Choose a valid product to restore." }, { status: 400 });
  }

  try {
    const { data, error } = await authorization.supabase
      .from("product")
      .update({ is_deleted: false })
      .eq("prodcode", id)
      .eq("is_deleted", true)
      .select("id:prodcode, code:prodcode, description, unit, is_deleted, stamp")
      .maybeSingle();

    if (error) {
      console.error("Could not restore product.", error);
      return Response.json({ error: "Product could not be restored." }, { status: 500 });
    }
    if (!data) {
      return Response.json({ error: "Deleted product was not found." }, { status: 404 });
    }

    return Response.json({
      product: {
        ...data,
        current_price: null,
        status: "Active",
        deleted_at: null,
      },
    });
  } catch (error) {
    console.error("Could not reach Supabase while restoring a product.", error);
    return Response.json(
      { error: "Product could not be restored. Check your connection and try again." },
      { status: 502 },
    );
  }
}
