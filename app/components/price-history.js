"use client";

import { useEffect, useState } from "react";
import { validatePriceInput } from "../lib/price-validation.mjs";

function formatAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "No price set";
  }

  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const EMPTY_PRICE = { amount: "", effective_date: "" };

export default function PriceHistory({
  accessToken,
  product,
  rights,
  onAuthExpired,
  onPricesChanged,
}) {
  const [prices, setPrices] = useState([]);
  const [formValues, setFormValues] = useState(EMPTY_PRICE);
  const [editingPrice, setEditingPrice] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPrices() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch(
          `/api/products/${encodeURIComponent(product.id)}/prices`,
          {
            cache: "no-store",
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          },
        );
        const result = await response.json();

        if (response.status === 401) {
          onAuthExpired();
          return;
        }
        if (!response.ok) {
          throw new Error(result.error || "Price history could not be loaded.");
        }
        setPrices(result.prices);
      } catch (error) {
        if (error.name !== "AbortError") {
          setLoadError(error.message || "Price history could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadPrices();
    return () => controller.abort();
  }, [accessToken, onAuthExpired, product.id, reloadKey]);

  function startAdd() {
    setIsFormOpen(true);
    setEditingPrice(null);
    setFormValues(EMPTY_PRICE);
    setErrors({});
    setFormError("");
    setNotice("");
  }

  function startEdit(price) {
    setIsFormOpen(true);
    setEditingPrice(price);
    setFormValues({
      amount: String(price.amount),
      effective_date: price.effective_date,
    });
    setErrors({});
    setFormError("");
    setNotice("");
  }

  async function submitPrice(event) {
    event.preventDefault();
    setErrors({});
    setFormError("");
    setNotice("");

    const validation = validatePriceInput(formValues);
    if (validation.errors) {
      setErrors(validation.errors);
      return;
    }

    setIsMutating(true);
    const endpoint = editingPrice
      ? `/api/products/${encodeURIComponent(product.id)}/prices/${encodeURIComponent(editingPrice.id)}`
      : `/api/products/${encodeURIComponent(product.id)}/prices`;
    try {
      const response = await fetch(endpoint, {
        method: editingPrice ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validation.value),
      });
      const result = await response.json();

      if (response.status === 401) {
        onAuthExpired();
        return;
      }
      if (response.status === 403) {
        setFormError(result.error || "You do not have permission to change prices.");
        return;
      }
      if (response.status === 409 || response.status === 422) {
        setErrors(result.errors || {});
        setFormError(result.errors ? "" : result.error);
        return;
      }
      if (!response.ok) {
        setFormError(result.error || "Price could not be saved.");
        return;
      }

      setFormValues(EMPTY_PRICE);
      setEditingPrice(null);
      setIsFormOpen(false);
      setNotice(editingPrice ? "Price updated." : "Price added.");
      setReloadKey((current) => current + 1);
      onPricesChanged();
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsMutating(false);
    }
  }

  async function deletePrice() {
    if (!pendingDelete) return;
    setIsMutating(true);
    setFormError("");
    try {
      const response = await fetch(
        `/api/products/${encodeURIComponent(product.id)}/prices/${encodeURIComponent(pendingDelete.id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const result = await response.json();

      if (response.status === 401) {
        onAuthExpired();
        return;
      }
      if (!response.ok) {
        setFormError(result.error || "Price could not be deleted.");
        return;
      }

      setPendingDelete(null);
      setNotice("Price deleted.");
      setReloadKey((current) => current + 1);
      onPricesChanged();
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsMutating(false);
    }
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
  const showForm = isFormOpen && (rights.add || (editingPrice && rights.edit));

  return (
    <section className="space-y-4 rounded-lg bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">Price history</h3>
          <p className="text-sm text-slate-600">{product.description}</p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            Current price as of today: {formatAmount(product.current_price)}
          </p>
        </div>
        {rights.add && !isFormOpen && (
          <button
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            onClick={startAdd}
            type="button"
          >
            Add price
          </button>
        )}
      </div>

      {notice && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {notice}
        </p>
      )}
      {loadError && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {loadError}
        </p>
      )}

      {showForm && (
        <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]" noValidate onSubmit={submitPrice}>
          <label className="text-sm font-medium text-slate-700" htmlFor={`price-amount-${product.id}`}>
            Amount
            <input
              aria-describedby={errors.amount ? `price-amount-error-${product.id}` : undefined}
              aria-invalid={Boolean(errors.amount)}
              className={inputClass}
              id={`price-amount-${product.id}`}
              inputMode="decimal"
              name="amount"
              onChange={(event) => {
                setFormValues((current) => ({ ...current, amount: event.target.value }));
                setErrors((current) => ({ ...current, amount: "" }));
              }}
              value={formValues.amount}
            />
            {errors.amount && (
              <span className="mt-1 block text-sm text-rose-700" id={`price-amount-error-${product.id}`}>
                {errors.amount}
              </span>
            )}
          </label>
          <label className="text-sm font-medium text-slate-700" htmlFor={`price-date-${product.id}`}>
            Effective date
            <input
              aria-describedby={errors.effective_date ? `price-date-error-${product.id}` : undefined}
              aria-invalid={Boolean(errors.effective_date)}
              className={inputClass}
              id={`price-date-${product.id}`}
              name="effective_date"
              onChange={(event) => {
                setFormValues((current) => ({ ...current, effective_date: event.target.value }));
                setErrors((current) => ({ ...current, effective_date: "" }));
              }}
              type="date"
              value={formValues.effective_date}
            />
            {errors.effective_date && (
              <span className="mt-1 block text-sm text-rose-700" id={`price-date-error-${product.id}`}>
                {errors.effective_date}
              </span>
            )}
          </label>
          <div className="flex items-end gap-2">
            <button
              className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
              disabled={isMutating}
              type="submit"
            >
              {isMutating ? "Saving..." : editingPrice ? "Save" : "Add"}
            </button>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setEditingPrice(null);
                setFormValues(EMPTY_PRICE);
                setIsFormOpen(false);
                setErrors({});
                setFormError("");
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
          {formError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 sm:col-span-3" role="alert">
              {formError}
            </p>
          )}
        </form>
      )}
      {formError && !showForm && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {formError}
        </p>
      )}

      {pendingDelete && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-sm text-rose-900">
            Delete the {formatAmount(pendingDelete.amount)} price effective {pendingDelete.effective_date}?
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              disabled={isMutating}
              onClick={() => setPendingDelete(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={isMutating}
              onClick={deletePrice}
              type="button"
            >
              {isMutating ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-[520px] w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold" scope="col">Effective date</th>
              <th className="px-4 py-3 text-right font-semibold" scope="col">Amount</th>
              {(rights.edit || rights.delete) && (
                <th className="px-4 py-3 font-semibold" scope="col">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prices.map((price) => (
              <tr key={price.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{price.effective_date}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-900">
                  {formatAmount(price.amount)}
                </td>
                {(rights.edit || rights.delete) && (
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      {rights.edit && (
                        <button
                          className="font-medium text-indigo-700 hover:text-indigo-900"
                          onClick={() => startEdit(price)}
                          type="button"
                        >
                          Edit
                        </button>
                      )}
                      {rights.delete && (
                        <button
                          className="font-medium text-rose-700 hover:text-rose-900"
                          onClick={() => setPendingDelete(price)}
                          type="button"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!isLoading && !loadError && prices.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={rights.edit || rights.delete ? 3 : 2}
                >
                  No prices have been recorded.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={rights.edit || rights.delete ? 3 : 2}
                >
                  Loading price history...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
