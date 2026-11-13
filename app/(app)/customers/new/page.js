"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { NoAccess } from "@/components/shell/no-access";
import { Breadcrumb, PageHeader } from "@/components/ui/surfaces";
import CustomerForm from "@/components/customers/customer-form";
import { PERMISSIONS } from "@/lib/domain/constants";

export default function NewCustomerPage() {
  const { can } = useAuth();
  const [returnTo, setReturnTo] = useState("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("returnTo");
    if (value) setReturnTo(value);
  }, []);

  if (!can(PERMISSIONS.CUSTOMER_CREATE)) {
    return (
      <NoAccess
        description="Adding a customer needs the Customer add right. Ask an admin if you should have it."
        title="You cannot add customers"
      />
    );
  }

  const listHref = `/customers${returnTo ? `?${returnTo}` : ""}`;

  return (
    <div className="page">
      <PageHeader
        breadcrumb={
          <Breadcrumb items={[{ label: "Customers", href: listHref }, { label: "New" }]} />
        }
        description="One form for adding and editing. The same rules apply in both places."
        title="New customer"
      />
      <CustomerForm backHref={listHref} mode="create" />
    </div>
  );
}
