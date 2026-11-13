"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { NoAccess } from "@/components/shell/no-access";
import { useAsyncData } from "@/components/hooks/use-async-data";
import { Breadcrumb, Card, PageHeader, TableSkeleton } from "@/components/ui/surfaces";
import CustomerForm from "@/components/customers/customer-form";
import { PERMISSIONS } from "@/lib/domain/constants";
import { getCustomer } from "@/lib/data/store";

export default function EditCustomerPage() {
  const params = useParams();
  const id = params?.id;
  const { can } = useAuth();
  const query = useAsyncData(() => getCustomer(id), [id]);

  if (!can(PERMISSIONS.CUSTOMER_EDIT)) {
    return (
      <NoAccess
        description="Editing a customer needs the Customer edit right."
        title="You cannot edit customers"
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
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">Customer not found</h1>
          <p className="mt-2 text-[13.5px] text-[color:var(--color-muted)]">
            The record may have been removed. Open the list to find it again.
          </p>
          <a className="btn btn-secondary mt-6" href="/customers">
            Back to customers
          </a>
        </Card>
      </div>
    );
  }

  if (query.data.isDeleted) {
    return (
      <div className="page">
        <Card className="mx-auto max-w-lg px-8 py-12 text-center">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">
            This customer is deleted
          </h1>
          <p className="mt-2 text-[13.5px] text-[color:var(--color-muted)]">
            Restore it before editing, so the change lands on a live record.
          </p>
          <a className="btn btn-secondary mt-6" href={`/customers/${id}`}>
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
              { label: "Customers", href: "/customers" },
              { label: query.data.name, href: `/customers/${id}` },
              { label: "Edit" },
            ]}
          />
        }
        description={`${query.data.code} · changes are written to the activity log with your name.`}
        title="Edit customer"
      />
      <CustomerForm
        afterSaveHref={`/customers/${id}`}
        backHref={`/customers/${id}`}
        customer={query.data}
        mode="edit"
      />
    </div>
  );
}
