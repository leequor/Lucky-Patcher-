"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "./supabase-client";

const minimumPasswordLength = 6;

function getSignupErrorMessage(error) {
  const code = error.code?.toLowerCase();
  const message = error.message?.toLowerCase() ?? "";

  if (
    code === "email_exists" ||
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already exists")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (code === "weak_password" || message.includes("password")) {
    return `Choose a password with at least ${minimumPasswordLength} characters.`;
  }

  return error.message || "We couldn't create your account. Please try again.";
}

export default function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email").trim();
    const password = formData.get("password");

    if (password.length < minimumPasswordLength) {
      setNotice({
        type: "error",
        message: `Choose a password with at least ${minimumPasswordLength} characters.`,
      });
      return;
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      setNotice({
        type: "error",
        message: "Registration is not configured. Add the Supabase URL and anon key.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setNotice({ type: "error", message: getSignupErrorMessage(error) });
        return;
      }

      if (data.user?.identities?.length === 0) {
        setNotice({
          type: "error",
          message: "An account with this email already exists. Try signing in instead.",
        });
        return;
      }

      setNotice({
        type: "success",
        message: data.session
          ? "Your account has been created. You can now sign in."
          : "Your account has been created. Check your email to confirm your address.",
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
          htmlFor="register-email"
        >
          Email
        </label>
        <input
          autoComplete="email"
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          id="register-email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="register-password"
        >
          Password
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          id="register-password"
          minLength={minimumPasswordLength}
          name="password"
          placeholder="At least 6 characters"
          required
          type="password"
        />
        <p className="mt-2 text-xs text-slate-500">
          Use at least {minimumPasswordLength} characters.
        </p>
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
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-semibold text-indigo-600 hover:text-indigo-500" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
