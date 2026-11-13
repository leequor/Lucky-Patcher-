"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../providers/auth-provider";
import { useToast } from "../providers/toast-provider";
import { Button, Field, Input } from "../ui/controls";
import { AlertIcon } from "../ui/icons";
import { validateRegistration } from "@/lib/domain/validation";

const EMPTY = { name: "", email: "", password: "", confirmPassword: "" };

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const { toast } = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const validation = validateRegistration(values);
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setBusy(true);
    try {
      await register(values);
      toast({
        title: "Account created",
        description: "You are signed in as a superadmin of this workspace.",
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      if (error.errors) setErrors(error.errors);
      setFormError(error.message ?? "We could not create your account.");
      setBusy(false);
    }
  }

  const passwordsMatch =
    values.confirmPassword.length > 0 && values.password === values.confirmPassword;

  return (
    <div>
      <h1 className="auth-title">Create an Account</h1>
      <p className="auth-sub">Sign up to your Hope, Inc. ERP account</p>

      <form className="mt-7 space-y-5" noValidate onSubmit={handleSubmit}>
        <Field error={errors.name} htmlFor="register-name" label="Full name">
          <Input
            autoComplete="name"
            autoFocus
            error={errors.name}
            id="register-name"
            name="name"
            onChange={(event) => update("name", event.target.value)}
            placeholder="Ada Villanueva"
            type="text"
            value={values.name}
          />
        </Field>

        <Field error={errors.email} htmlFor="register-email" label="Email">
          <Input
            autoComplete="email"
            error={errors.email}
            id="register-email"
            name="email"
            onChange={(event) => update("email", event.target.value)}
            placeholder="you@company.com"
            type="email"
            value={values.email}
          />
        </Field>

        <Field
          error={errors.password}
          hint="At least 6 characters."
          htmlFor="register-password"
          label="Password"
        >
          <Input
            autoComplete="new-password"
            error={errors.password}
            id="register-password"
            name="password"
            onChange={(event) => update("password", event.target.value)}
            type="password"
            value={values.password}
          />
        </Field>

        <Field
          error={errors.confirmPassword}
          hint={passwordsMatch ? "Passwords match." : undefined}
          htmlFor="register-confirm"
          label="Confirm password"
        >
          <Input
            autoComplete="new-password"
            error={errors.confirmPassword}
            id="register-confirm"
            name="confirmPassword"
            onChange={(event) => update("confirmPassword", event.target.value)}
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
          {busy ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      <p className="mt-7 text-center text-[13px] text-[color:var(--color-muted)]">
        Already have an account?{" "}
        <Link
          className="font-semibold text-[color:var(--color-ink)] underline decoration-[color:var(--color-line-strong)] underline-offset-[3px] hover:decoration-[color:var(--color-ink)]"
          href="/login"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
