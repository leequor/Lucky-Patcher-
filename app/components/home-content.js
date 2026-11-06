"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./supabase-client";

const criteria = [
  "Only visible when logged in",
  "If not logged in, user is sent to the login page",
  "Looks like the UI/mockup",
  "Shows the user's email and a logout button",
];

export default function HomeContent() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      router.replace("/login");
      setIsLoading(false);
      return;
    }

    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;

      if (!nextSession) {
        router.replace("/login");
        return;
      }

      setSession(nextSession);
      setIsLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          setAuthError("We couldn't check your sign-in status. Please refresh.");
          setIsLoading(false);
          return;
        }

        if (!data.session) {
          router.replace("/login");
          return;
        }

        setSession(data.session);
        setIsLoading(false);
      })
      .catch(() => {
        if (active) {
          setAuthError("We couldn't check your sign-in status. Please refresh.");
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

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

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Loading...
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-6 text-slate-800 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-700">Plan ID: S1-DEV-08 (simple version)</p>
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <span>{session.user.email}</span>
            <button
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSigningOut}
              onClick={handleSignOut}
              type="button"
            >
              {isSigningOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>

        <section className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Description</h1>
          </div>

          <div className="px-6 pb-8 pt-5">
            <p className="text-[15px] leading-7 text-slate-700">
              The first page the user sees after a successful login.
            </p>
          </div>

          <div className="border-t border-slate-200 px-6 pb-6 pt-5">
            <h2 className="mb-4 text-4xl font-semibold tracking-tight text-slate-900">
              Acceptance criteria
            </h2>

            <ul className="space-y-3 text-[15px] text-slate-700">
              {criteria.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-slate-400 bg-white">
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-transparent" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {authError && (
          <p
            aria-live="polite"
            className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
            {authError}
          </p>
        )}
      </div>
    </main>
  );
}
