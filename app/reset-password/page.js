import Link from "next/link";
import ResetPasswordForm from "../components/reset-password-form";

export const metadata = {
  title: "Choose a new password | Hope Inc. ERP",
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <Link
          className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600"
          href="/"
        >
          Hope Inc.
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-slate-950">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter and confirm a new password for your account.
        </p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
