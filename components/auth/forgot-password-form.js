"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Field, Input } from "../ui/controls";
import { AlertIcon, ArrowRightIcon } from "../ui/icons";
import { requestPasswordReset } from "@/lib/auth/session";
import { validateEmail } from "@/lib/domain/validation";

export default function ForgotPasswordForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setError("");
    setBusy(true);

    try {
      const result = await requestPasswordReset(email);
      setNotice({
        message: name.trim()
          ? `Thanks, ${name.trim().split(" ")[0]}. ${result.message}`
          : result.message,
        token: result.token,
      });
    } catch {
      setNotice({
        message: "We could not send the reset email. Try again in a moment.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="auth-title">Reset your Password</h1>
      <p className="auth-sub">We&apos;ll email you a link to reset it</p>

      <form className="mt-7 space-y-5" noValidate onSubmit={handleSubmit}>
        <Field
          hint="Optional — used only in the confirmation below."
          htmlFor="forgot-name"
          label="Name"
        >
          <Input
            autoComplete="name"
            id="forgot-name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Ada Villanueva"
            type="text"
            value={name}
          />
        </Field>

        <Field error={error} htmlFor="forgot-email" label="Email">
          <Input
            autoComplete="email"
            error={error}
            id="forgot-email"
            name="email"
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            placeholder="you@hopeinc.demo"
            type="email"
            value={email}
          />
        </Field>

        {notice ? (
          <div
            className={`rounded-[14px] px-4 py-3 text-[13px] ${
              notice.error
                ? "bg-[#f8e9e4] text-[#a23422]"
                : "bg-[#e7efe8] text-[#1d5b43]"
            }`}
            role={notice.error ? "alert" : "status"}
          >
            <p className="flex items-start gap-2.5">
              {notice.error ? <AlertIcon size={16} /> : null}
              <span>{notice.message}</span>
            </p>

            {notice.token ? (
              <div className="mt-3 rounded-[10px] bg-white/70 p-3">
                <p className="text-[12px] text-[color:var(--color-ink-soft)]">
                  Demo workspace: no email is sent. Open the reset link directly.
                </p>
                <Link
                  className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-line-strong)] underline-offset-[3px]"
                  href={`/reset-password?token=${notice.token}`}
                >
                  Open reset link
                  <ArrowRightIcon size={14} />
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <Button className="w-full" disabled={busy} type="submit">
          {busy ? "Sending link…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-7 text-center text-[13px] text-[color:var(--color-muted)]">
        Remembered it?{" "}
        <Link
          className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-line-strong)] underline-offset-[3px] hover:decoration-[color:var(--color-ink)]"
          href="/login"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
}
