"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useAsyncData } from "@/components/hooks/use-async-data";
import { useDebounced, useListState } from "@/components/hooks/use-list-state";
import { NoAccess } from "@/components/shell/no-access";
import {
  Avatar,
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  TableSkeleton,
} from "@/components/ui/surfaces";
import {
  Button,
  SearchInput,
  Select,
  StatusBadge,
} from "@/components/ui/controls";
import { PlusIcon, RestoreIcon, ArrowRightIcon } from "@/components/ui/icons";
import { listCustomers, restoreCustomer } from "@/lib/data/store";
import { PAGE_SIZE, PAY_TERMS, PERMISSIONS } from "@/lib/domain/constants";
import { formatDate, relativeTime } from "@/lib/domain/format";

const DEFAULTS = { q: "", status: "all", payTerms: "all", page: 1 };

export default function CustomersView({ initial }) {
  const { user, can } = useAuth();
  const { toast } = useToast();
  const { state, setFilter, setPage, reset, isFiltered } = useListState(DEFAULTS, initial);
  const [search, setSearch] = useState(state.q);
  const debouncedSearch = useDebounced(search);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    if (debouncedSearch !== state.q) setFilter("q", debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = useAsyncData(
    () =>
      listCustomers({
        q: state.q,
        status: state.status,
        payTerms: state.payTerms,
        page: state.page,
        pageSize: PAGE_SIZE,
      }),
    [state.q, state.status, state.payTerms, state.page],
  );

  if (!can(PERMISSIONS.CUSTOMER_VIEW)) {
    return (
      <NoAccess
        description="The customer list is limited to roles with the Customer view right."
        title="Customer records are not available to your role"
      />
    );
  }

  const data = query.data;
  const rows = data?.rows ?? [];
  const filtered = state.status !== "all" || state.payTerms !== "all" || Boolean(state.q);

  async function handleRestore(customer) {
    setRestoring(customer.id);
    try {
      await restoreCustomer(customer.id, user);
      toast({
        title: `${customer.name} restored`,
        description: `${customer.code} is back in the active list.`,
      });
      query.reload();
    } catch (error) {
      toast({ title: "Could not restore the customer", description: error.message, tone: "error" });
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="page">
      <PageHeader
        actions={
          can(PERMISSIONS.CUSTOMER_CREATE) ? (
            <Button href={`/customers/new?returnTo=${encodeURIComponent(currentQuery(state))}`}>
              <PlusIcon size={16} />
              New customer
            </Button>
          ) : null
        }
        description="Active accounts with their contact, payment terms and status."
        title="Customers"
      />

      <Card className="overflow-hidden">
        <div className="toolbar">
          <SearchInput
            label="Search customers by code, name, contact or phone"
            onChange={setSearch}
            placeholder="Search code, name, contact or phone"
            value={search}
          />

          <Select
            aria-label="Filter by status"
            onChange={(event) => setFilter("status", event.target.value)}
            value={state.status}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deleted">Deleted</option>
          </Select>

          <Select
            aria-label="Filter by payment terms"
            onChange={(event) => setFilter("payTerms", event.target.value)}
            value={state.payTerms}
          >
            <option value="all">All terms</option>
            {PAY_TERMS.map((term) => (
              <option key={term.value} value={term.value}>
                {term.short}
              </option>
            ))}
          </Select>

          {filtered ? (
            <button
              className="text-[12.5px] font-medium text-[color:var(--color-muted)] underline decoration-[color:var(--color-line-strong)] underline-offset-[3px] transition hover:text-[color:var(--color-ink)]"
              onClick={() => {
                reset();
                setSearch("");
              }}
              type="button"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {query.loading && !data ? (
          <TableSkeleton columns={5} rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            action={
              filtered ? (
                <Button
                  onClick={() => {
                    reset();
                    setSearch("");
                  }}
                  variant="secondary"
                >
                  Clear filters
                </Button>
              ) : can(PERMISSIONS.CUSTOMER_CREATE) ? (
                <Button href="/customers/new">
                  <PlusIcon size={16} />
                  Add the first customer
                </Button>
              ) : null
            }
            body={
              filtered
                ? "No customer matches these filters. Try a shorter search or a different status."
                : "Customer records hold the code, contact and payment terms used on every quote."
            }
            title={filtered ? "No matching customers" : "No customers yet"}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className="hidden md:table-cell">Contact</th>
                    <th className="hidden sm:table-cell">Terms</th>
                    <th>Status</th>
                    <th className="hidden lg:table-cell">
                      {state.status === "deleted" ? "Deleted" : "Updated"}
                    </th>
                    <th aria-label="Open" className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((customer) => (
                    <tr data-clickable="true" key={customer.id}>
                      <td>
                        <Link className="flex items-center gap-3" href={`/customers/${customer.id}`}>
                          <Avatar name={customer.name} size={34} />
                          <span className="min-w-0">
                            <span className="block truncate cell-strong">{customer.name}</span>
                            <span className="mt-0.5 block text-[12px] tabular-nums text-[color:var(--color-muted)]">
                              {customer.code}
                              <span className="sm:hidden">
                                {" · "}
                                {PAY_TERMS.find((term) => term.value === customer.payTerms)?.short ??
                                  customer.payTerms}
                              </span>
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="block text-[13px] text-[color:var(--color-ink-soft)]">
                          {customer.contactPerson || "—"}
                        </span>
                        <span className="cell-sub">{customer.email || customer.phone || ""}</span>
                      </td>
                      <td className="hidden text-[13px] text-[color:var(--color-ink-soft)] sm:table-cell">
                        {PAY_TERMS.find((term) => term.value === customer.payTerms)?.short ??
                          customer.payTerms}
                      </td>
                      <td>
                        <StatusBadge isDeleted={customer.isDeleted} status={customer.status} />
                      </td>
                      <td className="hidden text-[12.5px] text-[color:var(--color-muted)] lg:table-cell">
                        {customer.isDeleted ? (
                          formatDate(customer.deletedAt)
                        ) : (
                          relativeTime(customer.updatedAt)
                        )}
                      </td>
                      <td className="text-right">
                        {customer.isDeleted && can(PERMISSIONS.CUSTOMER_DELETE) ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled={restoring === customer.id}
                            onClick={() => handleRestore(customer)}
                            type="button"
                          >
                            <RestoreIcon size={14} />
                            {restoring === customer.id ? "Restoring…" : "Restore"}
                          </button>
                        ) : (
                          <Link
                            aria-label={`Open ${customer.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] text-[color:var(--color-muted)] transition hover:bg-[#efede5] hover:text-[color:var(--color-ink)]"
                            href={`/customers/${customer.id}`}
                          >
                            <ArrowRightIcon size={15} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              onPage={setPage}
              page={data.page}
              pageCount={data.pageCount}
              pageSize={data.pageSize}
              total={data.total}
              unit="customers"
            />
          </>
        )}
      </Card>
    </div>
  );
}

function currentQuery(state) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.status !== "all") params.set("status", state.status);
  if (state.payTerms !== "all") params.set("payTerms", state.payTerms);
  if (state.page > 1) params.set("page", String(state.page));
  return params.toString();
}
