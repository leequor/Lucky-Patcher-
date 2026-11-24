"use client";

import { useState } from "react";
import {
  PRODUCT_UNITS,
  validateProductInput,
} from "../lib/product-validation.mjs";

const EMPTY_PRODUCT = {
  code: "",
  description: "",
  unit: "",
};

function getProductValues(product) {
  return product
    ? {
        code: product.code || "",
        description: product.description || "",
        unit: product.unit || "",
      }
    : EMPTY_PRODUCT;
}

export default function ProductForm({
  accessToken,
  product,
  mode,
  onAuthExpired,
  onCancel,
  onSuccess,
}) {
  const [values, setValues] = useState(() => getProductValues(product));
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

    const validation = validateProductInput(values);
    if (validation.errors) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    const isEditing = mode === "edit";
    const endpoint = isEditing
      ? `/api/products/${encodeURIComponent(product.id)}`
      : "/api/products";

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
        setFormError(result.error || "You do not have permission to save this product.");
        return;
      }
      if (response.status === 409 || response.status === 422) {
        setErrors(result.errors || {});
        setFormError(result.errors ? "" : result.error);
        return;
      }
      if (!response.ok) {
        setFormError(result.error || "Product could not be saved. Please try again.");
        return;
      }

      onSuccess(isEditing ? "Product updated." : "Product added.");
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
      aria-labelledby="product-form-title"
      className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900" id="product-form-title">
          {mode === "edit" ? "Edit product" : "Add product"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Fields marked required must be completed.
        </p>
      </div>

      <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={submitForm}>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="product-code">
            Product code <span aria-hidden="true">*</span>
          </label>
          <input
            aria-describedby={errors.code ? "product-code-error" : undefined}
            aria-invalid={Boolean(errors.code)}
            autoComplete="off"
            className={inputClass}
            id="product-code"
            maxLength={20}
            name="code"
            onChange={updateField}
            required
            value={values.code}
          />
          {errors.code && (
            <p className="mt-1 text-sm text-rose-700" id="product-code-error">{errors.code}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="product-unit">
            Unit <span aria-hidden="true">*</span>
          </label>
          <select
            aria-describedby={errors.unit ? "product-unit-error" : undefined}
            aria-invalid={Boolean(errors.unit)}
            className={`${inputClass} bg-white`}
            id="product-unit"
            name="unit"
            onChange={updateField}
            required
            value={values.unit}
          >
            <option value="">Select unit</option>
            {PRODUCT_UNITS.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
          {errors.unit && (
            <p className="mt-1 text-sm text-rose-700" id="product-unit-error">{errors.unit}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="product-description">
            Description <span aria-hidden="true">*</span>
          </label>
          <input
            aria-describedby={errors.description ? "product-description-error" : undefined}
            aria-invalid={Boolean(errors.description)}
            className={inputClass}
            id="product-description"
            maxLength={200}
            name="description"
            onChange={updateField}
            required
            value={values.description}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-rose-700" id="product-description-error">
              {errors.description}
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
            {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </section>
  );
}
