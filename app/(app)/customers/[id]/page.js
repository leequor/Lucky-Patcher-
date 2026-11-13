"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useAsyncData } from "@/components/hooks/use-async-data";
import { NoAccess } from "@/components/shell/no-access";
import {
  Avatar,
  Breadcrumb,
  Card,
  CardHead,
  Modal,
  PageHeader,
} from "@/components/ui/surfaces";
import { Button, StatusBadge } from "@/components/ui/controls";
import {
  AlertIcon,
  EditIcon,
  MailIcon,
  PhoneIcon,
  RestoreIcon,
  TrashIcon,
} from "@/components/ui/icons";
import {
  deleteCustomer,
  getCustomer,
  listAuditFor,
  listTeam,
  restoreCustomer,
} from "@/lib/data/store";
import { AUDIT_RECORD_LABELS, PERMISSIONS } from "@/lib/domain/constants";
import { formatDate, formatDateTime, relativeTime } from "@/lib/domain/format";

function Fact({ label, value, href }) {
  return (
    <div>
      <dt className="text-[12px] text-[color:var(--color-muted)]">{label}</dt>
      <dd className="mt-1 text-[14px] leading-6 text-[color:var(--color-ink)]">
        {value ? (
          href ? (
            <a
              className="underline decoration-[color:var(--color-line-strong)] underline-offset-2 transition hover:decoration-[color:var(--color-ink)]"
              href={href}
            >
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-[color:var(--color-muted)]">—</span>
        )}
      </dd>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id;
  const { user, can } = useAuth();
  const { toast } = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const query = useAsyncData(async () => {
    const [customer, activity, team] = await Promise.all([
      getCustomer(id),
      listAuditFor("customer", id, 6),
      listTeam(),
    ]);
    return { customer, activity, team };
  }, [id]);

  const customer = query.data?.customer;
  const team = query.data?.team ?? [];
  const nameOf = (userId) => team.find((member) => member.id === userId)?.name ?? "Unknown user";

  if (!can(PERMISSIONS.CUSTOMER_VIEW)) {
    return (
      <NoAccess
        description="The customer record is limited to roles with the Customer view right."
        title="This record is not available to your role"
      />
    );
  }

  if (query.loading) {
    return (
      <div className="page">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton mt-4 h-9 w-72" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <div className="skeleton h-64 rounded-[24px]" />
          <div className="skeleton h-64 rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="page">
        <Card className="mx-auto max-w-lg px-8 py-12 text-center">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">Customer not found</h1>
          <p className="mt-2 text-[13.5px] text-[color:var(--color-muted)]">
            The record may have been removed, or the link is out of date.
          </p>
          <Button className="mt-6" href="/customers" variant="secondary">
            Back to customers
          </Button>
        </Card>
      </div>
    );
  }

  async function handleDelete() {
    setActionError("");
    setBusy(true);
    try {
      await deleteCustomer(customer.id, user);
      toast({
        title: `${customer.name} deleted`,
        description: "The record is kept and can be restored.",
      });
      setConfirmOpen(false);
      query.reload();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    setBusy(true);
    try {
      await restoreCustomer(customer.id, user);
      toast({ title: `${customer.name} restored` });
      query.reload();
    } catch (error) {
      toast({ title: "Could not restore", description: error.message, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        actions={
          <>
            {customer.isDeleted && can(PERMISSIONS.CUSTOMER_DELETE) ? (
              <Button disabled={busy} onClick={handleRestore} variant="secondary">
                <RestoreIcon size={16} />
                Restore customer
              </Button>
            ) : null}

            {!customer.isDeleted && can(PERMISSIONS.CUSTOMER_EDIT) ? (
              <Button href={`/customers/${customer.id}/edit`} variant="secondary">
                <EditIcon size={15} />
                Edit
              </Button>
            ) : null}

            {!customer.isDeleted && can(PERMISSIONS.CUSTOMER_DELETE) ? (
              <Button
                className="text-[color:var(--color-rust)]"
                onClick={() => {
                  setActionError("");
                  setConfirmOpen(true);
                }}
                variant="secondary"
              >
                <TrashIcon size={15} />
                Delete
              </Button>
            ) : null}
          </>
        }
        breadcrumb={
          <Breadcrumb
            items={[{ label: "Customers", href: "/customers" }, { label: customer.name }]}
          />
        }
        description={`${customer.code}${customer.address ? ` · ${customer.address}` : ""}`}
        title={customer.name}
      />

      {customer.isDeleted ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-[#f8e9e4] px-5 py-4">
          <p className="flex items-center gap-2.5 text-[13px] text-[#a23422]">
            <AlertIcon size={16} />
            Deleted {formatDate(customer.deletedAt)} by {nameOf(customer.deletedBy)}. It is
            hidden from the active list.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHead
              action={<StatusBadge isDeleted={customer.isDeleted} status={customer.status} />}
              description="Who to call, and where the order goes."
              title="Contact"
            />
            <dl className="grid grid-cols-1 gap-x-10 gap-y-6 px-7 py-6 sm:grid-cols-2">
              <Fact label="Contact person" value={customer.contactPerson} />
              <Fact label="Payment terms" value={
                customer.payTerms === "COD" ? "Cash on delivery" : customer.payTerms.replace("NET_", "Net ") + " days"
              } />
              <Fact
                href={customer.email ? `mailto:${customer.email}` : undefined}
                label="Email"
                value={customer.email}
              />
              <Fact
                href={customer.phone ? `tel:${customer.phone.replace(/\s/g, "")}` : undefined}
                label="Phone"
                value={customer.phone}
              />
              <div className="sm:col-span-2">
                <Fact label="Address" value={customer.address} />
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 border-t border-[color:var(--color-line)] px-7 py-4">
              {customer.email ? (
                <a className="btn btn-secondary btn-sm" href={`mailto:${customer.email}`}>
                  <MailIcon size={14} />
                  Email
                </a>
              ) : null}
              {customer.phone ? (
                <a className="btn btn-secondary btn-sm" href={`tel:${customer.phone.replace(/\s/g, "")}`}>
                  <PhoneIcon size={14} />
                  Call
                </a>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHead description="Delivery instructions and billing quirks." title="Notes" />
            <div className="px-7 py-6">
              {customer.notes ? (
                <p className="max-w-[70ch] text-[14px] leading-7 text-[color:var(--color-ink-soft)]">
                  {customer.notes}
                </p>
              ) : (
                <p className="text-[13.5px] text-[color:var(--color-muted)]">
                  No notes on this record yet.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHead
              action={
                can(PERMISSIONS.AUDIT_VIEW) ? (
                  <Link className="btn-link" href="/activity">
                    Full log
                  </Link>
                ) : null
              }
              description="Changes to this record, newest first."
              title="Activity"
            />
            {query.data.activity.length === 0 ? (
              <p className="px-7 py-8 text-[13px] text-[color:var(--color-muted)]">
                No changes recorded for this customer yet.
              </p>
            ) : (
              <ul>
                {query.data.activity.map((entry) => (
                  <li
                    className="flex items-start gap-3 border-t border-[#efece3] px-7 py-3.5 first:border-t-0"
                    key={entry.id}
                  >
                    <Avatar name={entry.actorName} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px]">
                        <span className="font-semibold">{entry.actorName}</span>{" "}
                        <span className="text-[color:var(--color-ink-soft)]">
                          {(AUDIT_RECORD_LABELS[entry.action] ?? "changed this record")}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[12px] text-[color:var(--color-muted)]">
                        {entry.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11.5px] tabular-nums text-[color:var(--color-muted)]">
                      {relativeTime(entry.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHead description="What the record says today." title="Account" />
            <dl className="space-y-5 px-7 py-6">
              <Fact label="Customer code" value={customer.code} />
              <Fact
                label="Payment terms"
                value={
                  customer.payTerms === "COD"
                    ? "Cash on delivery"
                    : `Net ${customer.payTerms.replace("NET_", "")} days`
                }
              />
              <Fact label="Status" value={customer.status === "active" ? "Active" : "Inactive"} />
              <div>
                <dt className="text-[12px] text-[color:var(--color-muted)]">Created</dt>
                <dd className="mt-1 text-[13.5px] leading-6">
                  {formatDateTime(customer.createdAt)}
                  <span className="block text-[12px] text-[color:var(--color-muted)]">
                    by {nameOf(customer.createdBy)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-[color:var(--color-muted)]">Last change</dt>
                <dd className="mt-1 text-[13.5px] leading-6">
                  {formatDateTime(customer.updatedAt)}
                  <span className="block text-[12px] text-[color:var(--color-muted)]">
                    by {nameOf(customer.updatedBy)}
                  </span>
                </dd>
              </div>
            </dl>
          </Card>

          {!customer.isDeleted ? (
            <Card>
              <CardHead description="What happens when you delete." title="Deleting this record" />
            <div className="px-7 py-6">
              <p className="text-[13px] leading-6 text-[color:var(--color-ink-soft)]">
                Deleting is a soft delete: the row keeps its code and history, disappears
                from active lists, and can be restored by anyone with the delete right.
              </p>
                <p className="mt-3 text-[13px] leading-6 text-[color:var(--color-muted)]">
                  Deleting is blocked while active child records still point at this
                  customer.
                </p>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <Modal
        description="The record is kept for history and can be restored later."
        footer={
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] text-[color:var(--color-muted)]">
              Written to the activity log.
            </p>
            <div className="flex gap-2.5">
              <Button onClick={() => setConfirmOpen(false)} variant="ghost">
                Cancel
              </Button>
              <Button disabled={busy} onClick={handleDelete} variant="danger">
                {busy ? "Deleting…" : "Delete customer"}
              </Button>
            </div>
          </div>
        }
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="Delete this customer?"
      >
        <div className="rounded-[14px] bg-[color:var(--color-sunken)] px-4 py-3">
          <p className="text-[13.5px] font-semibold">{customer.name}</p>
          <p className="mt-0.5 text-[12.5px] tabular-nums text-[color:var(--color-muted)]">
            {customer.code} · {customer.contactPerson || "No contact person"}
          </p>
        </div>

        {actionError ? (
          <p
            className="mt-3 flex items-start gap-2 rounded-[12px] bg-[#f8e9e4] px-3.5 py-2.5 text-[12.5px] text-[#a23422]"
            role="alert"
          >
            <AlertIcon size={15} />
            <span>{actionError}</span>
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
