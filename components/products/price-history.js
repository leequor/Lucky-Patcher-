"use client";

import { useState } from "react";
import { useAuth } from "../providers/auth-provider";
import { useToast } from "../providers/toast-provider";
import { Card, CardHead, Modal } from "../ui/surfaces";
import { Button, Field, Input, Textarea } from "../ui/controls";
import { AlertIcon, CalendarIcon, EditIcon, PlusIcon, TrashIcon } from "../ui/icons";
import { addPrice, deletePrice, updatePrice } from "@/lib/data/store";
import { PERMISSIONS } from "@/lib/domain/constants";
import { formatDate, formatMoney, todayISO } from "@/lib/domain/format";
import { priceAgeDays, priceDelta } from "@/lib/domain/pricing";

const EMPTY_FORM = { amount: "", effectiveDate: todayISO(), note: "" };

function PriceFormModal({ open, onClose, product, editing, onSaved }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [values, setValues] = useState(() =>
    editing
      ? {
          amount: String(editing.amount),
          effectiveDate: editing.effectiveDate,
          note: editing.note ?? "",
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setFormError("");

    try {
      if (editing) {
        await updatePrice(editing.id, values, user);
        toast({
          title: "Price updated",
          description: `${product.code} · ${formatMoney(Number(values.amount))} from ${formatDate(values.effectiveDate)}`,
        });
      } else {
        await addPrice(product.id, values, user);
        toast({
          title: "Price added",
          description: `${product.code} · ${formatMoney(Number(values.amount))} from ${formatDate(values.effectiveDate)}`,
        });
      }
      onSaved();
      onClose();
    } catch (error) {
      if (error.errors) setErrors(error.errors);
      setFormError(error.message ?? "We could not save this price.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      description={
        editing
          ? "Change the amount or the date this price took effect."
          : "A price takes effect on a date. The newest date on or before today is the current price."
      }
      onClose={onClose}
      open={open}
      title={editing ? "Edit price" : "Add a price"}
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <div className="form-grid">
          <Field
            error={errors.amount}
            hint="Two decimals at most."
            htmlFor="price-amount"
            label="Amount"
            required
          >
            <Input
              autoFocus
              error={errors.amount}
              id="price-amount"
              inputMode="decimal"
              onChange={(event) => update("amount", event.target.value)}
              placeholder="335.00"
              value={values.amount}
            />
          </Field>

          <Field
            error={errors.effectiveDate}
            hint="A future date is allowed and waits its turn."
            htmlFor="price-date"
            label="Effective date"
            required
          >
            <Input
              error={errors.effectiveDate}
              id="price-date"
              onChange={(event) => update("effectiveDate", event.target.value)}
              type="date"
              value={values.effectiveDate}
            />
          </Field>
        </div>

        <Field error={errors.note} htmlFor="price-note" label="Note">
          <Textarea
            error={errors.note}
            id="price-note"
            onChange={(event) => update("note", event.target.value)}
            placeholder="Supplier increase, freight adjustment, promo — anything worth keeping."
            rows={2}
            value={values.note}
          />
        </Field>

        {formError ? (
          <p
            className="flex items-start gap-2.5 rounded-[12px] bg-[#f8e9e4] px-3.5 py-2.5 text-[12.5px] text-[#a23422]"
            role="alert"
          >
            <AlertIcon size={15} />
            <span>{formError}</span>
          </p>
        ) : null}

        <div className="flex justify-end gap-2.5 pt-1">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button disabled={busy} type="submit">
            {busy ? "Saving…" : editing ? "Save price" : "Add price"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function PriceHistory({ product, prices, onChanged }) {
  const { user, can } = useAuth();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const canAdd = can(PERMISSIONS.PRICE_CREATE);
  const canEdit = can(PERMISSIONS.PRICE_EDIT);
  const canDelete = can(PERMISSIONS.PRICE_DELETE);

  const current = product.currentPrice;
  const today = todayISO();

  async function handleDelete() {
    setBusy(true);
    setDeleteError("");
    try {
      await deletePrice(deleting.id, user);
      toast({
        title: "Price deleted",
        description: `${formatMoney(deleting.amount)} from ${formatDate(deleting.effectiveDate)}`,
      });
      setDeleting(null);
      onChanged();
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card>
        <CardHead
          action={
            canAdd ? (
              <Button onClick={() => setAdding(true)} size="sm" variant="secondary">
                <PlusIcon size={15} />
                Add price
              </Button>
            ) : null
          }
          description="Newest first. The current price is the newest entry dated on or before today."
          title="Price history"
        />

        {prices.length === 0 ? (
          <div className="px-7 py-10 text-center">
            <p className="text-[15px] font-semibold">No price set</p>
            <p className="mx-auto mt-1.5 max-w-[46ch] text-[13px] leading-6 text-[color:var(--color-muted)]">
              This product has no dated price yet, so quotes cannot price it. Add the first
              entry with the date it took effect.
            </p>
            {canAdd ? (
              <Button className="mt-5" onClick={() => setAdding(true)} size="sm">
                <PlusIcon size={15} />
                Add the first price
              </Button>
            ) : null}
          </div>
        ) : (
          <div>
            {prices.map((price) => {
              const delta = priceDelta(prices, price);
              const isCurrent = current?.id === price.id;
              const isFuture = price.effectiveDate > today;
              const age = priceAgeDays(price, today);

              return (
                <div className="ladder-row" data-current={isCurrent} key={price.id}>
                  <div>
                    <p className="ladder-date">{formatDate(price.effectiveDate)}</p>
                    <p className="mt-0.5 text-[11.5px] text-[color:var(--color-muted)]">
                      {isFuture
                        ? "Scheduled"
                        : isCurrent
                          ? `Current · ${age} day${age === 1 ? "" : "s"}`
                          : `Superseded · ${age} days ago`}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="ladder-amount">{formatMoney(price.amount)}</p>
                    {price.note ? (
                      <p className="mt-0.5 truncate text-[12px] text-[color:var(--color-muted)]">
                        {price.note}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    {delta ? (
                      <span
                        className="ladder-delta w-[68px] text-right"
                        style={{ color: delta.amount > 0 ? "#8a5a12" : "#1d5b43" }}
                        title={`From ${formatMoney(delta.previousAmount)} on ${formatDate(delta.previousDate)}`}
                      >
                        {delta.amount > 0 ? "▲" : "▼"} {Math.abs(delta.percent).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="w-[68px] text-right text-[11.5px] text-[color:var(--color-muted)]">
                        first price
                      </span>
                    )}

                    <span className="flex w-[58px] justify-start">
                      {isCurrent ? (
                        <span className="rounded-[6px] bg-[#e7efe8] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#1d5b43]">
                          current
                        </span>
                      ) : null}
                    </span>

                    <div className="flex w-[72px] items-center justify-end gap-0.5">
                      {canEdit ? (
                        <button
                          aria-label={`Edit price from ${formatDate(price.effectiveDate)}`}
                          className="btn btn-ghost btn-icon"
                          onClick={() => setEditing(price)}
                          type="button"
                        >
                          <EditIcon size={15} />
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          aria-label={`Delete price from ${formatDate(price.effectiveDate)}`}
                          className="btn btn-ghost btn-icon text-[color:var(--color-rust)]"
                          onClick={() => {
                            setDeleteError("");
                            setDeleting(price);
                          }}
                          type="button"
                        >
                          <TrashIcon size={15} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-[color:var(--color-line)] px-7 py-3.5 text-[11.5px] text-[color:var(--color-muted)]">
          <CalendarIcon size={14} />
          Dates are compared as calendar days, not timestamps.
        </div>
      </Card>

      {adding ? (
        <PriceFormModal
          key="add"
          onClose={() => setAdding(false)}
          onSaved={onChanged}
          open
          product={product}
        />
      ) : null}

      {editing ? (
        <PriceFormModal
          editing={editing}
          key={editing.id}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
          open
          product={product}
        />
      ) : null}

      <Modal
        description="Deleting a price removes it from the ladder. The product keeps every other dated entry."
        onClose={() => setDeleting(null)}
        open={Boolean(deleting)}
        title="Delete this price?"
      >
        {deleting ? (
          <div className="rounded-[14px] bg-[color:var(--color-sunken)] px-4 py-3">
            <p className="text-[15px] font-semibold tabular-nums">{formatMoney(deleting.amount)}</p>
            <p className="mt-0.5 text-[12.5px] text-[color:var(--color-muted)]">
              effective {formatDate(deleting.effectiveDate)}
              {deleting.effectiveDate > today ? " · scheduled" : ""}
            </p>
          </div>
        ) : null}

        {deleteError ? (
          <p
            className="mt-3 flex items-start gap-2 rounded-[12px] bg-[#f8e9e4] px-3.5 py-2.5 text-[12.5px] text-[#a23422]"
            role="alert"
          >
            <AlertIcon size={15} />
            <span>{deleteError}</span>
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2.5">
          <Button onClick={() => setDeleting(null)} variant="ghost">
            Cancel
          </Button>
          <Button disabled={busy} onClick={handleDelete} variant="danger">
            {busy ? "Deleting…" : "Delete price"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
