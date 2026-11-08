import Link from "next/link";
import LoginForm from "../components/login-form";

export const metadata = {
  title: "Sign in | Hope Inc. ERP",
};

export default function LoginPage() {
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
          Sign in to your account
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter your email and password to continue.
        </p>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-indigo-600 hover:text-indigo-500" href="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
