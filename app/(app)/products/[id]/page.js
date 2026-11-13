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
import { AlertIcon, EditIcon, RestoreIcon, TrashIcon } from "@/components/ui/icons";
import PriceHistory from "@/components/products/price-history";
import {
  deleteProduct,
  getProduct,
  listAuditFor,
  listPrices,
  listTeam,
  restoreProduct,
} from "@/lib/data/store";
import { AUDIT_RECORD_LABELS, PERMISSIONS, UNITS } from "@/lib/domain/constants";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  relativeTime,
} from "@/lib/domain/format";
import { nextScheduledPrice, priceAgeDays, priceDelta } from "@/lib/domain/pricing";

function Fact({ label, value }) {
  return (
    <div>
      <dt className="text-[12px] text-[color:var(--color-muted)]">{label}</dt>
      <dd className="mt-1 text-[14px] leading-6">{value || <span className="text-[color:var(--color-muted)]">—</span>}</dd>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id;
  const { user, can } = useAuth();
  const { toast } = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const query = useAsyncData(async () => {
    const [product, prices, activity, team] = await Promise.all([
      getProduct(id),
      listPrices(id),
      listAuditFor("product", id, 6),
      listTeam(),
    ]);
    return { product, prices, activity, team };
  }, [id]);

  const product = query.data?.product;
  const prices = query.data?.prices ?? [];
  const team = query.data?.team ?? [];
  const nameOf = (userId) => team.find((member) => member.id === userId)?.name ?? "Unknown user";

  if (!can(PERMISSIONS.PRODUCT_VIEW)) {
    return (
      <NoAccess
        description="The product record is limited to roles with the Product view right."
        title="This record is not available to your role"
      />
    );
  }

  if (query.loading) {
    return (
      <div className="page">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton mt-4 h-9 w-80" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <div className="skeleton h-72 rounded-[24px]" />
          <div className="skeleton h-72 rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page">
        <Card className="mx-auto max-w-lg px-8 py-12 text-center">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">Product not found</h1>
          <p className="mt-2 text-[13.5px] text-[color:var(--color-muted)]">
            The record may have been removed, or the link is out of date.
          </p>
          <Button className="mt-6" href="/products" variant="secondary">
            Back to products
          </Button>
        </Card>
      </div>
    );
  }

  const current = product.currentPrice;
  const scheduled = nextScheduledPrice(prices);
  const delta = current ? priceDelta(prices, current) : null;
  const age = priceAgeDays(current);

  async function handleDelete() {
    setActionError("");
    setBusy(true);
    try {
      await deleteProduct(product.id, user);
      toast({
        title: `${product.code} deleted`,
        description: "The record and its price history are kept.",
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
      await restoreProduct(product.id, user);
      toast({ title: `${product.code} restored` });
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
            {product.isDeleted && can(PERMISSIONS.PRODUCT_DELETE) ? (
              <Button disabled={busy} onClick={handleRestore} variant="secondary">
                <RestoreIcon size={16} />
                Restore product
              </Button>
            ) : null}

            {!product.isDeleted && can(PERMISSIONS.PRODUCT_EDIT) ? (
              <Button href={`/products/${product.id}/edit`} variant="secondary">
                <EditIcon size={15} />
                Edit
              </Button>
            ) : null}

            {!product.isDeleted && can(PERMISSIONS.PRODUCT_DELETE) ? (
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
            items={[{ label: "Products", href: "/products" }, { label: product.code }]}
          />
        }
        description={`${product.code} · sold by the ${UNITS.find((unit) => unit.value === product.unit)?.short ?? product.unit}`}
        title={product.description}
      />

      {product.isDeleted ? (
        <div className="mb-6 rounded-[18px] bg-[#f8e9e4] px-5 py-4">
          <p className="flex items-center gap-2.5 text-[13px] text-[#a23422]">
            <AlertIcon size={16} />
            Deleted {formatDate(product.deletedAt)} by {nameOf(product.deletedBy)}. Price history
            is intact and comes back with a restore.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          <PriceHistory onChanged={query.reload} prices={prices} product={product} />

          <Card>
            <CardHead description="Storage rules and substitutions." title="Notes" />
            <div className="px-7 py-6">
              {product.notes ? (
                <p className="max-w-[70ch] text-[14px] leading-7 text-[color:var(--color-ink-soft)]">
                  {product.notes}
                </p>
              ) : (
                <p className="text-[13.5px] text-[color:var(--color-muted)]">
                  No notes on this product yet.
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
              description="Changes to this product and its prices."
              title="Activity"
            />
            {query.data.activity.length === 0 ? (
              <p className="px-7 py-8 text-[13px] text-[color:var(--color-muted)]">
                No changes recorded for this product yet.
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
            <CardHead description="As of today" title="Current price" />
            <div className="px-7 pb-6 pt-5">
              {current ? (
                <>
                  <p className="text-[36px] font-semibold leading-none tracking-[-0.045em] tabular-nums">
                    {formatMoney(current.amount)}
                  </p>
                  <p className="mt-2 text-[12.5px] text-[color:var(--color-muted)]">
                    since {formatDate(current.effectiveDate)} · {age} day{age === 1 ? "" : "s"}
                  </p>

                  {delta ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-[8px] bg-[color:var(--color-sunken)] px-2.5 py-1 text-[12px] font-medium tabular-nums">
                      <span style={{ color: delta.amount > 0 ? "#8a5a12" : "#1d5b43" }}>
                        {delta.amount > 0 ? "▲" : "▼"}
                      </span>
                      {formatMoney(Math.abs(delta.amount))} ({Math.abs(delta.percent).toFixed(1)}%)
                      <span className="font-normal text-[color:var(--color-muted)]">
                        vs previous
                      </span>
                    </p>
                  ) : null}

                  <div className="mt-5 flex items-center gap-2">
                    <StatusBadge isDeleted={product.isDeleted} status={product.status} />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[20px] font-semibold tracking-[-0.02em]">No price set</p>
                  <p className="mt-2 text-[13px] leading-6 text-[color:var(--color-muted)]">
                    This product cannot be quoted until a dated price exists. Add the first
                    entry and it becomes the current price immediately.
                  </p>
                </>
              )}

              {scheduled ? (
                <p className="mt-4 border-t border-[color:var(--color-line)] pt-3 text-[12px] text-[color:var(--color-muted)]">
                  Next: {formatMoney(scheduled.amount)} from {formatDate(scheduled.effectiveDate)}
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHead description="What the record says today." title="Product" />
            <dl className="space-y-5 px-7 py-6">
              <Fact label="Product code" value={product.code} />
              <Fact
                label="Unit"
                value={UNITS.find((unit) => unit.value === product.unit)?.label ?? product.unit}
              />
              <Fact label="Status" value={product.status === "active" ? "Active" : "Inactive"} />
              <Fact label="Price records" value={String(product.priceCount)} />
              <div>
                <dt className="text-[12px] text-[color:var(--color-muted)]">Created</dt>
                <dd className="mt-1 text-[13.5px] leading-6">
                  {formatDateTime(product.createdAt)}
                  <span className="block text-[12px] text-[color:var(--color-muted)]">
                    by {nameOf(product.createdBy)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-[color:var(--color-muted)]">Last change</dt>
                <dd className="mt-1 text-[13.5px] leading-6">
                  {formatDateTime(product.updatedAt)}
                  <span className="block text-[12px] text-[color:var(--color-muted)]">
                    by {nameOf(product.updatedBy)}
                  </span>
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <Modal
        description="The record and its price history are kept and can be restored."
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
                {busy ? "Deleting…" : "Delete product"}
              </Button>
            </div>
          </div>
        }
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="Delete this product?"
      >
        <div className="rounded-[14px] bg-[color:var(--color-sunken)] px-4 py-3">
          <p className="text-[13.5px] font-semibold">{product.description}</p>
          <p className="mt-0.5 text-[12.5px] tabular-nums text-[color:var(--color-muted)]">
            {product.code} · {product.priceCount} price record
            {product.priceCount === 1 ? "" : "s"}
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
