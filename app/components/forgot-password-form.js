"use client";

import { useState } from "react";
import { getSupabaseClient } from "./supabase-client";

export default function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email").trim();
    const supabase = getSupabaseClient();

    if (!supabase) {
      setNotice({
        type: "error",
        message:
          "Password reset is not configured. Add the Supabase URL and anon key.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setNotice({
          type: "error",
          message: "We couldn't send a reset email. Wait a moment and try again.",
        });
        return;
      }

      setNotice({
        type: "success",
        message:
          "If an account exists for this email, password reset instructions have been sent.",
      });
      form.reset();
    } catch {
      setNotice({
        type: "error",
        message: "We couldn't reach Supabase. Check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="forgot-password-email"
        >
          Email
        </label>
        <input
          autoComplete="email"
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          id="forgot-password-email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </div>

      {notice && (
        <p
          aria-live="polite"
          className={`rounded-lg px-4 py-3 text-sm ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-800"
          }`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          {notice.message}
        </p>
      )}

      <button
        className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending link..." : "Send reset link"}
      </button>
    </form>
  );
}
