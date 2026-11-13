"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../providers/auth-provider";
import { Button, Field, Input } from "../ui/controls";
import { AlertIcon } from "../ui/icons";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/data/seed";
import { ROLE_LABELS } from "@/lib/domain/constants";

function safeNext() {
  if (typeof window === "undefined") return "/dashboard";
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

export default function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [entryNotice, setEntryNotice] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signedOut") === "1") setEntryNotice("You have been signed out.");
    else if (params.get("reset") === "1") {
      setEntryNotice("Your password has been updated. Sign in with the new one.");
    }
  }, []);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function validate() {
    const next = {};
    if (!values.email.trim()) next.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
      next.email = "That does not look like an email address.";
    }
    if (!values.password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setBusy(true);
    try {
      await signIn(values.email, values.password);
      router.replace(safeNext());
      router.refresh();
    } catch (error) {
      setFormError(error.message ?? "We could not sign you in. Try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="auth-title">Welcome Back</h1>
      <p className="auth-sub">Login to your Hope, Inc. ERP account</p>

      {entryNotice ? (
        <p
          className="mt-6 rounded-[14px] bg-[#e7efe8] px-4 py-3 text-[13px] text-[#1d5b43]"
          role="status"
        >
          {entryNotice}
        </p>
      ) : null}

      <form className="mt-7 space-y-5" noValidate onSubmit={handleSubmit}>
        <Field error={errors.email} htmlFor="login-email" label="Email">
          <Input
            autoComplete="email"
            autoFocus
            error={errors.email}
            id="login-email"
            name="email"
            onChange={(event) => update("email", event.target.value)}
            placeholder="you@hopeinc.demo"
            type="email"
            value={values.email}
          />
        </Field>

        <Field error={errors.password} htmlFor="login-password" label="Password">
          <Input
            autoComplete="current-password"
            error={errors.password}
            id="login-password"
            name="password"
            onChange={(event) => update("password", event.target.value)}
            type="password"
            value={values.password}
          />
        </Field>

        <div className="flex justify-end">
          <Link
            className="text-[13px] font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-line-strong)] underline-offset-[3px] transition hover:decoration-[color:var(--color-ink)]"
            href="/forgot-password"
          >
            Forgot your password?
          </Link>
        </div>

        {formError ? (
          <p
            className="flex items-start gap-2.5 rounded-[14px] bg-[#f8e9e4] px-4 py-3 text-[13px] text-[#a23422]"
            role="alert"
          >
            <AlertIcon size={16} />
            <span>{formError}</span>
          </p>
        ) : null}

        <Button className="w-full" disabled={busy} type="submit">
          {busy ? "Signing in…" : "Login"}
        </Button>
      </form>

      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-[color:var(--color-line)]" />
          <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
            or
          </span>
          <span className="h-px flex-1 bg-[color:var(--color-line)]" />
        </div>

        <div className="social-row mt-4" aria-describedby="sso-note">
          {["Google", "Microsoft", "Apple"].map((provider) => (
            <button
              aria-disabled="true"
              className="social-btn text-[12.5px] font-semibold text-[#a49d8e]"
              disabled
              key={provider}
              type="button"
            >
              {provider}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[11.5px] text-[color:var(--color-muted)]" id="sso-note">
          Single sign-on is not enabled in this workspace.
        </p>
      </div>

      <div className="mt-7 rounded-[18px] border border-[color:var(--color-line)] bg-[color:var(--color-sunken)] p-4">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-muted)]">
          Demo accounts
        </p>
        <p className="mt-1 text-[12.5px] text-[color:var(--color-ink-soft)]">
          Password <span className="font-semibold">{DEMO_PASSWORD}</span> for all three.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-1.5">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              className="flex items-center justify-between gap-3 rounded-[10px] bg-white px-3 py-2 text-left transition hover:bg-[#f6f4ec] disabled:opacity-50"
              disabled={busy}
              key={account.id}
              onClick={() => setValues({ email: account.email, password: DEMO_PASSWORD })}
              type="button"
            >
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold">
                  {account.email}
                </span>
                <span className="block text-[11.5px] text-[color:var(--color-muted)]">
                  {ROLE_LABELS[account.role]}
                </span>
              </span>
              <span className="text-[11.5px] font-semibold text-[color:var(--color-muted)]">
                Use
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-7 text-center text-[13px] text-[color:var(--color-muted)]">
        Don&apos;t have an account?{" "}
        <Link className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-line-strong)] underline-offset-[3px] hover:decoration-[color:var(--color-ink)]" href="/register">
          Sign up
        </Link>
      </p>
    </div>
  );
}
