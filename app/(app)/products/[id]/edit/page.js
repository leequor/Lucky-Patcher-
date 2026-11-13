"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { NoAccess } from "@/components/shell/no-access";
import { useAsyncData } from "@/components/hooks/use-async-data";
import { Breadcrumb, Card, PageHeader, TableSkeleton } from "@/components/ui/surfaces";
import ProductForm from "@/components/products/product-form";
import { PERMISSIONS } from "@/lib/domain/constants";
import { getProduct } from "@/lib/data/store";

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id;
  const { can } = useAuth();
  const query = useAsyncData(() => getProduct(id), [id]);

  if (!can(PERMISSIONS.PRODUCT_EDIT)) {
    return (
      <NoAccess
        description="Editing a product needs the Product edit right."
        title="You cannot edit products"
      />
    );
  }

  if (query.loading) {
    return (
      <div className="page">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton mt-4 h-8 w-64" />
        <Card className="mt-8">
          <TableSkeleton columns={3} rows={4} />
        </Card>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="page">
        <Card className="mx-auto max-w-lg px-8 py-12 text-center">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">Product not found</h1>
          <p className="mt-2 text-[13.5px] text-[color:var(--color-muted)]">
            The record may have been removed. Open the list to find it again.
          </p>
          <a className="btn btn-secondary mt-6" href="/products">
            Back to products
          </a>
        </Card>
      </div>
    );
  }

  if (query.data.isDeleted) {
    return (
      <div className="page">
        <Card className="mx-auto max-w-lg px-8 py-12 text-center">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">This product is deleted</h1>
          <p className="mt-2 text-[13.5px] text-[color:var(--color-muted)]">
            Restore it before editing, so the change lands on a live record.
          </p>
          <a className="btn btn-secondary mt-6" href={`/products/${id}`}>
            Open the record
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Products", href: "/products" },
              { label: query.data.code, href: `/products/${id}` },
              { label: "Edit" },
            ]}
          />
        }
        description={`${query.data.code} · prices are edited on the product page, not here.`}
        title="Edit product"
      />
      <ProductForm
        afterSaveHref={`/products/${id}`}
        backHref={`/products/${id}`}
        mode="edit"
        product={query.data}
      />
    </div>
  );
}
