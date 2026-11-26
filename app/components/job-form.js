"use client";

import { useState } from "react";
import { validateJobInput } from "../lib/job-validation.mjs";

function getValues(job) {
  return job
    ? { code: job.code || "", title: job.title || "", description: job.description || "" }
    : { code: "", title: "", description: "" };
}

export default function JobForm({
  accessToken,
  job,
  mode,
  onAuthExpired,
  onCancel,
  onSuccess,
}) {
  const [values, setValues] = useState(() => getValues(job));
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

    const validation = validateJobInput(values);
    if (validation.errors) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    const isEditing = mode === "edit";
    const endpoint = isEditing
      ? `/api/jobs/${encodeURIComponent(job.id)}`
      : "/api/jobs";

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
        setFormError(result.error || "You do not have permission to save this job.");
        return;
      }
      if (response.status === 409 || response.status === 422) {
        setErrors(result.errors || {});
        setFormError(result.errors ? "" : result.error);
        return;
      }
      if (!response.ok) {
        setFormError(result.error || "Job could not be saved.");
        return;
      }

      onSuccess(isEditing ? "Job updated." : "Job added.");
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
        {mode === "edit" ? "Edit job" : "Add job"}
      </h2>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" noValidate onSubmit={submitForm}>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="job-code">
            Job code <span aria-hidden="true">*</span>
          </label>
          <input
            aria-invalid={Boolean(errors.code)}
            className={inputClass}
            id="job-code"
            maxLength={20}
            name="code"
            onChange={updateField}
            required
            value={values.code}
          />
          {errors.code && <p className="mt-1 text-sm text-rose-700">{errors.code}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="job-title">
            Job title <span aria-hidden="true">*</span>
          </label>
          <input
            aria-invalid={Boolean(errors.title)}
            className={inputClass}
            id="job-title"
            maxLength={100}
            name="title"
            onChange={updateField}
            required
            value={values.title}
          />
          {errors.title && <p className="mt-1 text-sm text-rose-700">{errors.title}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="job-description">
            Description
          </label>
          <textarea
            aria-invalid={Boolean(errors.description)}
            className={`${inputClass} min-h-24 resize-y`}
            id="job-description"
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
            {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Add job"}
          </button>
        </div>
      </form>
    </section>
  );
}
