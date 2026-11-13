"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Field, Input } from "../ui/controls";
import { AlertIcon } from "../ui/icons";
import { inspectResetToken, resetPassword } from "@/lib/auth/session";
import { validatePasswordPair } from "@/lib/domain/validation";

function readToken() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token") ?? "";
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState("checking");
  const [tokenState, setTokenState] = useState(null);
  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const token = readToken();

    if (!token) {
      setTokenState({
        valid: false,
        message: "This page needs a reset link. Request a new one to continue.",
      });
      setStatus("blocked");
      return () => {
        active = false;
      };
    }

    inspectResetToken(token)
      .then((result) => {
        if (!active) return;
        setTokenState(result);
        setStatus(result.valid ? "ready" : "blocked");
      })
      .catch(() => {
        if (!active) return;
        setTokenState({
          valid: false,
          message: "We could not verify this reset link. Request a new one.",
        });
        setStatus("blocked");
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const validation = validatePasswordPair(values.password, values.confirmPassword);
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setBusy(true);
    try {
      await resetPassword(readToken(), values.password);
      router.replace("/login?reset=1");
      router.refresh();
    } catch (error) {
      if (error.errors) setErrors(error.errors);
      setFormError(error.message ?? "We could not update your password.");
      setBusy(false);
    }
  }

  if (status === "checking") {
    return (
      <div>
        <h1 className="auth-title">Reset your Password</h1>
        <p className="auth-sub">Checking your reset link…</p>
        <div className="mt-8 space-y-3" aria-hidden="true">
          <div className="skeleton h-[46px] w-full rounded-[14px]" />
          <div className="skeleton h-[46px] w-full rounded-[14px]" />
          <div className="skeleton h-[46px] w-full rounded-[14px]" />
        </div>
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div>
        <h1 className="auth-title">Reset link unavailable</h1>
        <p className="auth-sub">The link cannot be used to change a password.</p>

        <p
          className="mt-7 flex items-start gap-2.5 rounded-[14px] bg-[#f8e9e4] px-4 py-3 text-[13px] text-[#a23422]"
          role="alert"
        >
          <AlertIcon size={16} />
          <span>{tokenState?.message}</span>
        </p>

        <Button className="mt-6 w-full" href="/forgot-password">
          Request a new reset link
        </Button>

        <p className="mt-7 text-center text-[13px] text-[color:var(--color-muted)]">
          Remembered it?{" "}
          <Link className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-line-strong)] underline-offset-[3px]" href="/login">
            Back to log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="auth-title">Set a new password</h1>
      <p className="auth-sub">
        For <span className="font-medium text-[color:var(--color-ink-soft)]">{tokenState?.email}</span>
      </p>

      <form className="mt-7 space-y-5" noValidate onSubmit={handleSubmit}>
        <Field
          error={errors.password}
          hint="At least 6 characters."
          htmlFor="reset-password"
          label="New password"
        >
          <Input
            autoComplete="new-password"
            autoFocus
            error={errors.password}
            id="reset-password"
            name="password"
            onChange={(event) => {
              setValues((current) => ({ ...current, password: event.target.value }));
              setErrors((current) => ({ ...current, password: undefined }));
            }}
            type="password"
            value={values.password}
          />
        </Field>

        <Field
          error={errors.confirmPassword}
          htmlFor="reset-confirm"
          label="Confirm new password"
        >
          <Input
            autoComplete="new-password"
            error={errors.confirmPassword}
            id="reset-confirm"
            name="confirmPassword"
            onChange={(event) => {
              setValues((current) => ({ ...current, confirmPassword: event.target.value }));
              setErrors((current) => ({ ...current, confirmPassword: undefined }));
            }}
            type="password"
            value={values.confirmPassword}
          />
        </Field>

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
          {busy ? "Updating password…" : "Reset password"}
        </Button>
      </form>

      <p className="mt-4 text-center text-[12px] text-[color:var(--color-muted)]">
        Using this link signs out every open session.
      </p>
    </div>
  );
}
