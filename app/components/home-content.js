"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SupabaseStatus from "./supabase-status";
import { getSupabaseClient } from "./supabase-client";

export default function HomeContent() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let active = true;
    let receivedAuthEvent = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      receivedAuthEvent = true;
      if (active) {
        setSession(nextSession);
        setIsLoading(false);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || receivedAuthEvent) {
          return;
        }

        if (error) {
          setAuthError("We couldn't check your sign-in status. Please refresh.");
        } else {
          setSession(data.session);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (active && !receivedAuthEvent) {
          setAuthError("We couldn't check your sign-in status. Please refresh.");
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setAuthError("");
    const supabase = getSupabaseClient();

    if (!supabase) {
      setAuthError("Sign out is not available because Supabase is not configured.");
      return;
    }

    setIsSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError("We couldn't sign you out. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setAuthError("We couldn't reach Supabase. Check your connection and try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10">
      <header className="flex items-center justify-between border-b border-slate-200 pb-6">
        <Link
          className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600"
          href="/"
        >
          Hope Inc.
        </Link>
        {!isLoading && (
          <nav className="flex items-center gap-4 text-sm">
            {session ? (
              <>
                <span className="hidden text-slate-600 sm:inline">
                  {session.user.email}
                </span>
                <button
                  className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  type="button"
                >
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  className="font-semibold text-slate-700 hover:text-indigo-600"
                  href="/login"
                >
                  Sign in
                </Link>
                <Link
                  className="rounded-lg bg-indigo-600 px-3 py-2 font-semibold text-white transition hover:bg-indigo-500"
                  href="/register"
                >
                  Create account
                </Link>
              </>
            )}
          </nav>
        )}
      </header>

      <section className="grid flex-1 content-center gap-8 py-12 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            {session ? "Signed in" : "Base application"}
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {session ? "Welcome to your workspace." : "A solid foundation for the team's tools."}
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
            {session
              ? "You are signed in and can securely sign out whenever you're done."
              : "The app is running. Sign in to your account or create one to get started."}
          </p>
          {authError && (
            <p
              aria-live="polite"
              className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800"
              role="alert"
            >
              {authError}
            </p>
          )}
        </div>
        <SupabaseStatus />
      </section>

      <footer className="border-t border-slate-200 pt-5 text-sm text-slate-500">
        Hope Inc. ERP
      </footer>
    </main>
  );
}
