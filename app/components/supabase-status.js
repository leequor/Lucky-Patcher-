"use client";

import { useEffect, useState } from "react";

export default function SupabaseStatus() {
  const [status, setStatus] = useState({
    state: "checking",
    message: "Checking Supabase connection...",
  });

  useEffect(() => {
    let active = true;

    async function checkConnection() {
      try {
        const response = await fetch("/api/health/supabase", {
          cache: "no-store",
        });
        const result = await response.json();

        if (active) {
          setStatus({ state: result.status, message: result.message });
        }
      } catch {
        if (active) {
          setStatus({
            state: "failed",
            message: "Could not check the Supabase connection.",
          });
        }
      }
    }

    checkConnection();
    return () => {
      active = false;
    };
  }, []);

  const indicator =
    status.state === "connected"
      ? "bg-emerald-500"
      : status.state === "checking"
        ? "bg-amber-400"
        : "bg-rose-500";

  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-live="polite"
    >
      <span
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${indicator}`}
        aria-hidden="true"
      />
      <div>
        <p className="font-medium text-slate-900">Supabase connection</p>
        <p className="mt-1 text-sm text-slate-600">{status.message}</p>
      </div>
    </div>
  );
}
