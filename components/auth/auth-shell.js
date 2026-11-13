"use client";

import Link from "next/link";
import { Wordmark } from "../shell/app-shell";

const fragments = {
  login: {
    eyebrow: "Records · price history",
    statement: "Every quote traces back to a dated price.",
    body: (
      <>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#16140f]">
              Portland cement, 40 kg bag
            </p>
            <p className="mt-0.5 text-[11.5px] text-[#7c766a]">PRD-2005 · sold by the box</p>
          </div>
          <span className="badge badge-active">Active</span>
        </div>

        <div className="mt-4 space-y-0">
          {[
            { date: "1 Sep 2026", amount: "₱335.00", delta: "+8.1%", current: true },
            { date: "20 Aug 2025", amount: "₱310.00", delta: "+8.8%", current: false },
            { date: "5 Nov 2024", amount: "₱285.00", delta: null, current: false },
          ].map((row) => (
            <div
              className="flex items-center justify-between gap-3 border-t border-[#efece3] py-2.5 first:border-t-0 first:pt-0"
              key={row.date}
            >
              <div className="flex items-center gap-2">
                <span className="text-[12px] tabular-nums text-[#7c766a]">{row.date}</span>
                {row.current ? (
                  <span className="rounded-[5px] bg-[#e7efe8] px-1.5 py-0.5 text-[10px] font-semibold text-[#1d5b43]">
                    current
                  </span>
                ) : null}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-semibold tabular-nums text-[#16140f]">
                  {row.amount}
                </span>
                {row.delta ? (
                  <span className="w-[42px] text-right text-[11px] font-medium tabular-nums text-[#8a5a12]">
                    {row.delta}
                  </span>
                ) : (
                  <span className="w-[42px]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  register: {
    eyebrow: "Records · customers",
    statement: "One customer record, kept current by the people who use it.",
    body: (
      <>
        <div className="flex items-center justify-between gap-4">
          <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#16140f]">
            Summit Builders
          </p>
          <span className="code">CUS-1004</span>
        </div>
        <dl className="mt-4 space-y-2.5 text-[12.5px]">
          {[
            ["Contact", "Danilo Cruz"],
            ["Terms", "Net 45"],
            ["Site", "Tagaytay"],
            ["Status", "Active"],
          ].map(([label, value]) => (
            <div className="flex items-center justify-between gap-4" key={label}>
              <dt className="text-[#7c766a]">{label}</dt>
              <dd className="font-medium text-[#16140f]">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 border-t border-[#efece3] pt-3 text-[11.5px] text-[#7c766a]">
          Last change · payment terms Net 30 → Net 45, by Marco Tan
        </div>
      </>
    ),
  },
  reset: {
    eyebrow: "Security",
    statement: "A reset link works once, then it is spent.",
    body: (
      <>
        <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#16140f]">
          Password reset
        </p>
        <ul className="mt-3 space-y-2.5 text-[12.5px] text-[#4b463c]">
          <li className="flex gap-2.5">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#1d5b43]" />
            The link expires after 15 minutes.
          </li>
          <li className="flex gap-2.5">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#1d5b43]" />
            Using it signs every open session out.
          </li>
          <li className="flex gap-2.5">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#1d5b43]" />
            Requesting again invalidates nothing — the newest link still wins.
          </li>
        </ul>
      </>
    ),
  },
};

export function AuthShell({ children, fragment = "login" }) {  const content = fragments[fragment] ?? fragments.login;

  return (
    <div className="auth-shell">
      <div className="auth-form-side">
        <header className="flex items-center justify-between">
          <Wordmark />
          <Link
            className="text-[12.5px] font-medium text-[color:var(--color-muted)] transition hover:text-[color:var(--color-ink)]"
            href="/"
          >
            Back to home
          </Link>
        </header>

        <div className="auth-card">{children}</div>

        <footer className="flex items-center justify-between text-[11.5px] text-[color:var(--color-muted)]">
          <span>© 2026 Hope, Inc.</span>
          <span>Demo workspace</span>
        </footer>
      </div>

      <aside className="auth-aside">
        <div className="my-auto">
          <p className="max-w-[15ch] text-[30px] font-medium leading-[1.18] tracking-[-0.035em] text-white">
            {content.statement}
          </p>

          <div className="mt-9 rounded-[20px] bg-white p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
            {content.body}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11.5px] text-white/40">
          <span>Hope, Inc. ERP</span>
          <span>Sprint 2 · records</span>
        </div>
      </aside>
    </div>
  );
}

export default AuthShell;
