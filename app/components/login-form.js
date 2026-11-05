"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./supabase-client";

export default function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email").trim();
    const password = formData.get("password");
    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMessage(
        "Sign in is not configured. Add the Supabase URL and anon key.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage("Invalid email or password. Please try again.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErrorMessage(
        "We couldn't reach Supabase. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="login-email"
        >
          Email
        </label>
        <input
          autoComplete="email"
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          id="login-email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="login-password"
        >
          Password
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          id="login-password"
          name="password"
          required
          type="password"
        />
      </div>

      {errorMessage && (
        <p
          aria-live="polite"
          className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <button
        className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
