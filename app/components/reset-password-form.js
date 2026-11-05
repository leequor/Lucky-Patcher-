"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./supabase-client";

const minimumPasswordLength = 6;

export default function ResetPasswordForm() {
  const router = useRouter();
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkIsValid, setLinkIsValid] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    const currentUrl = new URL(window.location.href);
    const hashParams = new URLSearchParams(currentUrl.hash.slice(1));
    const hasAuthError =
      currentUrl.searchParams.has("error") ||
      currentUrl.searchParams.has("error_code") ||
      hashParams.has("error") ||
      hashParams.has("error_code");

    if (hasAuthError) {
      setNotice({
        type: "error",
        message:
          "This reset link is invalid, expired, or already used. Request a new one.",
      });
      setIsCheckingLink(false);
      return () => {
        active = false;
      };
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      setNotice({
        type: "error",
        message:
          "Password reset is not configured. Add the Supabase URL and anon key.",
      });
      setIsCheckingLink(false);
      return () => {
        active = false;
      };
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) {
          return;
        }

        if (error || !data.session) {
          setNotice({
            type: "error",
            message:
              "This reset link is invalid, expired, or already used. Request a new one.",
          });
        } else {
          setLinkIsValid(true);
        }
        setIsCheckingLink(false);
      })
      .catch(() => {
        if (active) {
          setNotice({
            type: "error",
            message:
              "We couldn't verify this reset link. Request a new one and try again.",
          });
          setIsCheckingLink(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirmation = formData.get("confirm-password");

    if (password.length < minimumPasswordLength) {
      setNotice({
        type: "error",
        message: `Choose a password with at least ${minimumPasswordLength} characters.`,
      });
      return;
    }

    if (password !== confirmation) {
      setNotice({ type: "error", message: "The passwords do not match." });
      return;
    }

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
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setNotice({
          type: "error",
          message:
            "We couldn't update your password. The reset link may have expired; request a new one and try again.",
        });
        return;
      }

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setNotice({
          type: "error",
          message:
            "Your password was changed, but we couldn't end this session. Please sign out before continuing.",
        });
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setNotice({
        type: "error",
        message: "We couldn't reach Supabase. Check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingLink) {
    return (
      <p className="mt-8 text-sm text-slate-600" role="status">
        Checking your reset link...
      </p>
    );
  }

  if (!linkIsValid) {
    return (
      <div className="mt-8 space-y-5">
        {notice && (
          <p
            aria-live="polite"
            className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800"
            role="alert"
          >
            {notice.message}
          </p>
        )}
        <Link
          className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200"
          href="/forgot-password"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="reset-password"
        >
          New password
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          id="reset-password"
          minLength={minimumPasswordLength}
          name="password"
          required
          type="password"
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="reset-password-confirmation"
        >
          Confirm new password
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          id="reset-password-confirmation"
          minLength={minimumPasswordLength}
          name="confirm-password"
          required
          type="password"
        />
      </div>

      {notice && (
        <p
          aria-live="polite"
          className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {notice.message}
        </p>
      )}

      <button
        className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Updating password..." : "Reset password"}
      </button>
    </form>
  );
}
