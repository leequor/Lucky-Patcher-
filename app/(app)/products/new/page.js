"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { NoAccess } from "@/components/shell/no-access";
import { Breadcrumb, PageHeader } from "@/components/ui/surfaces";
import ProductForm from "@/components/products/product-form";
import { PERMISSIONS } from "@/lib/domain/constants";

export default function NewProductPage() {
  const { can } = useAuth();
  const [returnTo, setReturnTo] = useState("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("returnTo");
    if (value) setReturnTo(value);
  }, []);

  if (!can(PERMISSIONS.PRODUCT_CREATE)) {
    return (
      <NoAccess
        description="Adding a product needs the Product add right. Ask an admin if you should have it."
        title="You cannot add products"
      />
    );
  }

  const listHref = `/products${returnTo ? `?${returnTo}` : ""}`;

  return (
    <div className="page">
      <PageHeader
        breadcrumb={
          <Breadcrumb items={[{ label: "Products", href: listHref }, { label: "New" }]} />
        }
        description="Add the record now; the first dated price comes next."
        title="New product"
      />
      <ProductForm backHref={listHref} mode="create" />
    </div>
  );
}
