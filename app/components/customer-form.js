"use client";

import { useState } from "react";
import {
  CUSTOMER_PAY_TERMS,
  validateCustomerInput,
} from "../lib/customer-validation.mjs";

const EMPTY_CUSTOMER = {
  code: "",
  name: "",
  address: "",
  pay_terms: "",
};

function getCustomerValues(customer) {
  return customer
    ? {
        code: customer.code || "",
        name: customer.name || "",
        address: customer.address || "",
        pay_terms: customer.pay_terms || "",
      }
    : EMPTY_CUSTOMER;
}

export default function CustomerForm({
  accessToken,
  customer,
  mode,
  onAuthExpired,
  onCancel,
  onSuccess,
}) {
  const [values, setValues] = useState(() => getCustomerValues(customer));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  }

  async function submitForm(event) {
    event.preventDefault();
    setErrors({});
    setFormError("");

    const validation = validateCustomerInput(values);
    if (validation.errors) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    const isEditing = mode === "edit";
    const endpoint = isEditing
      ? `/api/customers/${encodeURIComponent(customer.id)}`
      : "/api/customers";

    try {
      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
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
        setFormError(result.error || "You do not have permission to save this customer.");
        return;
      }
      if (response.status === 409 || response.status === 422) {
        setErrors(result.errors || {});
        setFormError(result.errors ? "" : result.error);
        return;
      }
      if (!response.ok) {
        setFormError(result.error || "Customer could not be saved. Please try again.");
        return;
      }

      onSuccess(isEditing ? "Customer updated." : "Customer added.");
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <section
      aria-labelledby="customer-form-title"
      className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900" id="customer-form-title">
          {mode === "edit" ? "Edit customer" : "Add customer"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Fields marked required must be completed.
        </p>
      </div>

      <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={submitForm}>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="customer-code">
            Customer code <span aria-hidden="true">*</span>
          </label>
          <input
            aria-describedby={errors.code ? "customer-code-error" : undefined}
            aria-invalid={Boolean(errors.code)}
            autoComplete="off"
            className={inputClass}
            id="customer-code"
            maxLength={10}
            name="code"
            onChange={updateField}
            required
            value={values.code}
          />
          {errors.code && (
            <p className="mt-1 text-sm text-rose-700" id="customer-code-error">
              {errors.code}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="customer-name">
            Customer name <span aria-hidden="true">*</span>
          </label>
          <input
            aria-describedby={errors.name ? "customer-name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            className={inputClass}
            id="customer-name"
            maxLength={100}
            name="name"
            onChange={updateField}
            required
            value={values.name}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-rose-700" id="customer-name-error">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="customer-address">
            Address
          </label>
          <input
            aria-describedby={errors.address ? "customer-address-error" : undefined}
            aria-invalid={Boolean(errors.address)}
            className={inputClass}
            id="customer-address"
            maxLength={200}
            name="address"
            onChange={updateField}
            value={values.address}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-rose-700" id="customer-address-error">
              {errors.address}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="customer-pay-terms">
            Pay terms
          </label>
          <select
            aria-describedby={errors.pay_terms ? "customer-pay-terms-error" : undefined}
            aria-invalid={Boolean(errors.pay_terms)}
            className={`${inputClass} bg-white`}
            id="customer-pay-terms"
            name="pay_terms"
            onChange={updateField}
            value={values.pay_terms}
          >
            <option value="">Select pay terms</option>
            {CUSTOMER_PAY_TERMS.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
          {errors.pay_terms && (
            <p className="mt-1 text-sm text-rose-700" id="customer-pay-terms-error">
              {errors.pay_terms}
            </p>
          )}
        </div>

        {formError && (
          <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:col-span-2" role="alert">
            {formError}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 sm:col-span-2">
          <button
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Add customer"}
          </button>
        </div>
      </form>
    </section>
  );
}
