"use client";

import { useState } from "react";
import { validateDepartmentInput } from "../lib/department-validation.mjs";

function getValues(department) {
  return department
    ? {
        code: department.code || "",
        name: department.name || "",
        description: department.description || "",
      }
    : { code: "", name: "", description: "" };
}

export default function DepartmentForm({
  accessToken,
  department,
  mode,
  onAuthExpired,
  onCancel,
  onSuccess,
}) {
  const [values, setValues] = useState(() => getValues(department));
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

    const validation = validateDepartmentInput(values);
    if (validation.errors) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    const isEditing = mode === "edit";
    const endpoint = isEditing
      ? `/api/departments/${encodeURIComponent(department.id)}`
      : "/api/departments";

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
        setFormError(result.error || "You do not have permission to save this department.");
        return;
      }
      if (response.status === 409 || response.status === 422) {
        setErrors(result.errors || {});
        setFormError(result.errors ? "" : result.error);
        return;
      }
      if (!response.ok) {
        setFormError(result.error || "Department could not be saved.");
        return;
      }

      onSuccess(isEditing ? "Department updated." : "Department added.");
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        {mode === "edit" ? "Edit department" : "Add department"}
      </h2>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" noValidate onSubmit={submitForm}>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="department-code">
            Department code <span aria-hidden="true">*</span>
          </label>
          <input
            aria-invalid={Boolean(errors.code)}
            className={inputClass}
            id="department-code"
            maxLength={20}
            name="code"
            onChange={updateField}
            required
            value={values.code}
          />
          {errors.code && <p className="mt-1 text-sm text-rose-700">{errors.code}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="department-name">
            Department name <span aria-hidden="true">*</span>
          </label>
          <input
            aria-invalid={Boolean(errors.name)}
            className={inputClass}
            id="department-name"
            maxLength={100}
            name="name"
            onChange={updateField}
            required
            value={values.name}
          />
          {errors.name && <p className="mt-1 text-sm text-rose-700">{errors.name}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="department-description">
            Description
          </label>
          <textarea
            aria-invalid={Boolean(errors.description)}
            className={`${inputClass} min-h-24 resize-y`}
            id="department-description"
            maxLength={500}
            name="description"
            onChange={updateField}
            value={values.description}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-rose-700">{errors.description}</p>
          )}
        </div>
        {formError && (
          <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:col-span-2" role="alert">
            {formError}
          </p>
        )}
        <div className="flex justify-end gap-3 sm:col-span-2">
          <button
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Add department"}
          </button>
        </div>
      </form>
    </section>
  );
}
