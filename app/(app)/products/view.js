"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useAsyncData } from "@/components/hooks/use-async-data";
import { useDebounced, useListState } from "@/components/hooks/use-list-state";
import { NoAccess } from "@/components/shell/no-access";
import {
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  TableSkeleton,
} from "@/components/ui/surfaces";
import { Button, SearchInput, Select, StatusBadge } from "@/components/ui/controls";
import { ArrowRightIcon, PlusIcon, RestoreIcon } from "@/components/ui/icons";
import { listProducts, restoreProduct } from "@/lib/data/store";
import { PAGE_SIZE, PERMISSIONS, UNITS } from "@/lib/domain/constants";
import { formatDate, formatMoney, relativeTime } from "@/lib/domain/format";

const DEFAULTS = { q: "", unit: "all", status: "all", priceState: "all", page: 1 };

export default function ProductsView({ initial }) {
  const { user, can } = useAuth();
  const { toast } = useToast();
  const { state, setFilter, setPage, reset } = useListState(DEFAULTS, initial);
  const [search, setSearch] = useState(state.q);
  const debouncedSearch = useDebounced(search);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    if (debouncedSearch !== state.q) setFilter("q", debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = useAsyncData(
    () =>
      listProducts({
        q: state.q,
        unit: state.unit,
        status: state.status,
        priceState: state.priceState,
        page: state.page,
        pageSize: PAGE_SIZE,
      }),
    [state.q, state.unit, state.status, state.priceState, state.page],
  );

  if (!can(PERMISSIONS.PRODUCT_VIEW)) {
    return (
      <NoAccess
        description="The product list is limited to roles with the Product view right."
        title="Product records are not available to your role"
      />
    );
  }

  const data = query.data;
  const rows = data?.rows ?? [];
  const filtered =
    state.unit !== "all" ||
    state.status !== "all" ||
    state.priceState !== "all" ||
    Boolean(state.q);

  async function handleRestore(product) {
    setRestoring(product.id);
    try {
      await restoreProduct(product.id, user);
      toast({
        title: `${product.code} restored`,
        description: "Its price history came back with it.",
      });
      query.reload();
    } catch (error) {
      toast({ title: "Could not restore the product", description: error.message, tone: "error" });
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="page">
      <PageHeader
        actions={
          can(PERMISSIONS.PRODUCT_CREATE) ? (
            <Button href={`/products/new?returnTo=${encodeURIComponent(currentQuery(state))}`}>
              <PlusIcon size={16} />
              New product
            </Button>
          ) : null
        }
        description="The catalogue, with the price that is live today from its dated history."
        title="Products"
      />

      <Card className="overflow-hidden">
        <div className="toolbar">
          <SearchInput
            label="Search products by code or description"
            onChange={setSearch}
            placeholder="Search code or description"
            value={search}
          />

          <Select
            aria-label="Filter by unit"
            onChange={(event) => setFilter("unit", event.target.value)}
            value={state.unit}
          >
            <option value="all">All units</option>
            {UNITS.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </Select>

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
            aria-label="Filter by price state"
            onChange={(event) => setFilter("priceState", event.target.value)}
            value={state.priceState}
          >
            <option value="all">Any price</option>
            <option value="missing">No price set</option>
            <option value="set">Priced</option>
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
              ) : can(PERMISSIONS.PRODUCT_CREATE) ? (
                <Button href="/products/new">
                  <PlusIcon size={16} />
                  Add the first product
                </Button>
              ) : null
            }
            body={
              filtered
                ? "No product matches these filters. Try a shorter search or a different unit."
                : "The catalogue holds the code, unit and dated price behind every quote."
            }
            title={filtered ? "No matching products" : "No products yet"}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="hidden sm:table-cell">Unit</th>
                    <th className="num">Current price</th>
                    <th className="hidden sm:table-cell">Status</th>
                    <th className="hidden lg:table-cell">
                      {state.status === "deleted" ? "Deleted" : "Updated"}
                    </th>
                    <th aria-label="Open" className="hidden w-10 sm:table-cell" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((product) => (
                    <tr data-clickable="true" key={product.id}>
                      <td>
                        <Link className="block" href={`/products/${product.id}`}>
                          <span className="block cell-strong">{product.description}</span>
                          <span className="mt-0.5 block text-[12px] tabular-nums text-[color:var(--color-muted)]">
                            {product.code}
                            <span className="sm:hidden">
                              {" · "}
                              {product.unit.toLowerCase()} · {product.status}
                            </span>
                            {product.priceCount > 0
                              ? ` · ${product.priceCount} price record${product.priceCount === 1 ? "" : "s"}`
                              : ""}
                          </span>
                        </Link>
                      </td>
                      <td className="hidden text-[13px] text-[color:var(--color-ink-soft)] sm:table-cell">
                        {product.unit.toLowerCase()}
                      </td>
                      <td className="num">
                        {product.currentPrice ? (
                          <>
                            <span className="cell-strong">
                              {formatMoney(product.currentPrice.amount)}
                            </span>
                            <span className="cell-sub hidden sm:block">
                              since {formatDate(product.currentPrice.effectiveDate)}
                            </span>
                          </>
                        ) : (
                          <span className="text-[12.5px] italic text-[color:var(--color-muted)]">
                            No price set
                          </span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell">
                        <StatusBadge isDeleted={product.isDeleted} status={product.status} />
                      </td>
                      <td className="hidden text-[12.5px] text-[color:var(--color-muted)] lg:table-cell">
                        {product.isDeleted
                          ? formatDate(product.deletedAt)
                          : relativeTime(product.updatedAt)}
                      </td>
                      <td className="hidden text-right sm:table-cell">
                        {product.isDeleted && can(PERMISSIONS.PRODUCT_DELETE) ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled={restoring === product.id}
                            onClick={() => handleRestore(product)}
                            type="button"
                          >
                            <RestoreIcon size={14} />
                            {restoring === product.id ? "Restoring…" : "Restore"}
                          </button>
                        ) : (
                          <Link
                            aria-label={`Open ${product.description}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] text-[color:var(--color-muted)] transition hover:bg-[#efede5] hover:text-[color:var(--color-ink)]"
                            href={`/products/${product.id}`}
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
              unit="products"
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
  if (state.unit !== "all") params.set("unit", state.unit);
  if (state.status !== "all") params.set("status", state.status);
  if (state.priceState !== "all") params.set("priceState", state.priceState);
  if (state.page > 1) params.set("page", String(state.page));
  return params.toString();
}
