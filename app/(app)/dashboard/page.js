"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useAsyncData } from "@/components/hooks/use-async-data";
import { Avatar, Card, CardHead, PageHeader, TableSkeleton } from "@/components/ui/surfaces";
import { Button } from "@/components/ui/controls";
import { ArrowRightIcon, PlusIcon, AlertIcon } from "@/components/ui/icons";
import { getWorkspaceStats, listAudit, listProducts } from "@/lib/data/store";
import {
  AUDIT_ACTION_LABELS,
  PERMISSIONS,
  ROLE_LABELS,
} from "@/lib/domain/constants";
import { relativeTime, formatMoney, formatDate } from "@/lib/domain/format";

const ACCESS_ROWS = [
  { permission: PERMISSIONS.CUSTOMER_VIEW, label: "View customers" },
  { permission: PERMISSIONS.CUSTOMER_CREATE, label: "Add customers" },
  { permission: PERMISSIONS.CUSTOMER_EDIT, label: "Edit customers" },
  { permission: PERMISSIONS.CUSTOMER_DELETE, label: "Delete / restore customers" },
  { permission: PERMISSIONS.PRODUCT_VIEW, label: "View products" },
  { permission: PERMISSIONS.PRODUCT_CREATE, label: "Add products" },
  { permission: PERMISSIONS.PRODUCT_EDIT, label: "Edit products" },
  { permission: PERMISSIONS.PRODUCT_DELETE, label: "Delete / restore products" },
  { permission: PERMISSIONS.PRICE_CREATE, label: "Add prices" },
  { permission: PERMISSIONS.PRICE_EDIT, label: "Edit prices" },
  { permission: PERMISSIONS.PRICE_DELETE, label: "Delete prices" },
  { permission: PERMISSIONS.AUDIT_VIEW, label: "Read the activity log" },
];

export default function DashboardPage() {
  const { user, can } = useAuth();

  const canAudit = can(PERMISSIONS.AUDIT_VIEW);

  const stats = useAsyncData(() => getWorkspaceStats(), []);
  const activity = useAsyncData(() => listAudit({ pageSize: 7 }), []);
  const products = useAsyncData(() => listProducts({ pageSize: 4, sort: "updated" }), []);

  const data = stats.data;

  return (
    <div className="page">
      <PageHeader
        actions={
          can(PERMISSIONS.CUSTOMER_CREATE) ? (
            <Button href="/customers/new">
              <PlusIcon size={16} />
              New customer
            </Button>
          ) : null
        }
        description="Customer and product records, and what changed recently."
        title="Overview"
      />

      {stats.loading && !data ? (
        <div className="stat-row">
          {[0, 1, 2, 3].map((index) => (
            <div className="stat" key={index}>
              <div className="skeleton h-3 w-24" />
              <div className="skeleton mt-4 h-8 w-16" />
              <div className="skeleton mt-3 h-3 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="stat-row">
          <div className="stat">
            <p className="stat-label">Active customers</p>
            <p className="stat-value">{data?.activeCustomers ?? 0}</p>
            <p className="stat-note">
              {data?.inactiveCustomers ?? 0} inactive
            </p>
          </div>
          <div className="stat">
            <p className="stat-label">Active products</p>
            <p className="stat-value">{data?.activeProducts ?? 0}</p>
            <p className="stat-note">
              {data?.productsWithoutPrice ?? 0} without a price
            </p>
          </div>
          <div className="stat">
            <p className="stat-label">Price records</p>
            <p className="stat-value">{data?.priceRecords ?? 0}</p>
            <p className="stat-note">Dated entries behind current prices</p>
          </div>
          <div className="stat">
            <p className="stat-label">Changes, 30 days</p>
            <p className="stat-value">{data?.recentChanges ?? 0}</p>
            <p className="stat-note">Each one attributed to a user</p>
          </div>
        </div>
      )}

      <div className={`mt-6 grid grid-cols-1 gap-6 ${canAudit ? "lg:grid-cols-[1.5fr_1fr]" : ""}`}>
        {canAudit ? (
        <Card>
          <CardHead
            action={
              can(PERMISSIONS.AUDIT_VIEW) ? (
                <Link className="btn-link" href="/activity">
                  Full log
                </Link>
              ) : null
            }
            description="Every create, edit, delete and restore, newest first."
            title="Recent activity"
          />

          {activity.loading && !activity.data ? (
            <TableSkeleton columns={3} rows={5} />
          ) : activity.data?.rows?.length ? (
            <ul>
              {activity.data.rows.map((entry) => (
                <li
                  className="flex items-start gap-3 border-b border-[#efece3] px-6 py-3.5 last:border-b-0"
                  key={entry.id}
                >
                  <Avatar name={entry.actorName} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-5">
                      <span className="font-semibold">{entry.actorName}</span>{" "}
                      <span className="text-[color:var(--color-ink-soft)]">
                        {(AUDIT_ACTION_LABELS[entry.action] ?? "Changed").toLowerCase()}
                      </span>{" "}
                      <span className="font-medium">{entry.entityLabel}</span>
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-[color:var(--color-muted)]">
                      {entry.detail}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11.5px] tabular-nums text-[color:var(--color-muted)]">
                    {relativeTime(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-8 text-[13px] text-[color:var(--color-muted)]">
              Nothing recorded yet.
            </p>
          )}
        </Card>
        ) : null}

        <div className={canAudit ? "space-y-6" : "grid gap-6 lg:grid-cols-2"}>
          <Card>
            <CardHead
              description="Records that are missing a decision."
              title="Needs attention"
            />
            <div className="divide-y divide-[#efece3]">
              <div className="flex items-start gap-3 px-6 py-4">
                <span className="mt-0.5 text-[color:var(--color-amber)]">
                  <AlertIcon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">
                    {data?.productsWithoutPrice ?? 0} product
                    {(data?.productsWithoutPrice ?? 0) === 1 ? "" : "s"} with no price
                  </p>
                  {data?.productsWithoutPriceList?.length ? (
                    <ul className="mt-1.5 space-y-1">
                      {data.productsWithoutPriceList.map((product) => (
                        <li key={product.id}>
                          <Link
                            className="text-[12.5px] text-[color:var(--color-ink-soft)] underline decoration-[color:var(--color-line-strong)] underline-offset-2 hover:text-[color:var(--color-ink)]"
                            href={`/products/${product.id}`}
                          >
                            {product.code} · {product.description}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-[12.5px] text-[color:var(--color-muted)]">
                      Every active product has a current price.
                    </p>
                  )}
                </div>
              </div>

              <Link
                className="flex items-center justify-between gap-3 px-6 py-4 transition hover:bg-[#fbfaf6]"
                href="/customers?status=deleted"
              >
                <div>
                  <p className="text-[13px] font-medium">Deleted customers</p>
                  <p className="mt-0.5 text-[12px] text-[color:var(--color-muted)]">
                    Restore a record without losing its history
                  </p>
                </div>
                <ArrowRightIcon size={15} />
              </Link>

              <Link
                className="flex items-center justify-between gap-3 px-6 py-4 transition hover:bg-[#fbfaf6]"
                href="/products?status=deleted"
              >
                <div>
                  <p className="text-[13px] font-medium">Deleted products</p>
                  <p className="mt-0.5 text-[12px] text-[color:var(--color-muted)]">
                    Price history is kept with the product
                  </p>
                </div>
                <ArrowRightIcon size={15} />
              </Link>
            </div>
          </Card>

          <Card>
            <CardHead
              description={`Signed in as ${ROLE_LABELS[user?.role] ?? "Staff"}.`}
              title="Your access"
            />
            <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 px-6 py-5 sm:grid-cols-2">
              {ACCESS_ROWS.map((row) => {
                const allowed = can(row.permission);
                return (
                  <li
                    className={`flex items-center gap-2 text-[12.5px] ${
                      allowed ? "" : "text-[color:var(--color-muted)] line-through decoration-[#d2ccbb]"
                    }`}
                    key={row.permission}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full ${
                        allowed ? "bg-[#1d5b43]" : "bg-[#d2ccbb]"
                      }`}
                    />
                    {row.label}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHead
          action={
            can(PERMISSIONS.PRODUCT_VIEW) ? (
              <Link className="btn-link" href="/products">
                All products
              </Link>
            ) : null
          }
          description="Newest changes to the catalogue, with the price live today."
          title="Recently updated products"
        />
        {products.loading && !products.data ? (
          <TableSkeleton columns={4} rows={4} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit</th>
                  <th className="num">Current price</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {products.data?.rows?.map((product) => (
                  <tr data-clickable="true" key={product.id}>
                    <td>
                      <Link className="block" href={`/products/${product.id}`}>
                        <span className="cell-strong">{product.description}</span>
                        <span className="cell-sub">{product.code}</span>
                      </Link>
                    </td>
                    <td className="text-[color:var(--color-ink-soft)]">
                      {product.unit.toLowerCase()}
                    </td>
                    <td className="num">
                      {product.currentPrice ? (
                        <>
                          <span className="cell-strong">{formatMoney(product.currentPrice.amount)}</span>
                          <span className="cell-sub">
                            since {formatDate(product.currentPrice.effectiveDate)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[12.5px] italic text-[color:var(--color-muted)]">
                          No price set
                        </span>
                      )}
                    </td>
                    <td className="text-[12.5px] text-[color:var(--color-muted)]">
                      {relativeTime(product.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
