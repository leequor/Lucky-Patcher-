"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Wordmark } from "@/components/shell/app-shell";
import { ArrowRightIcon } from "@/components/ui/icons";

const previewRows = [
  {
    code: "PRD-2005",
    name: "Portland cement, 40 kg bag",
    unit: "box",
    price: "₱335.00",
    since: "1 Sep 2026",
  },
  {
    code: "PRD-2002",
    name: "Galvanised steel sheet, 4 x 8 ft",
    unit: "pc",
    price: "₱1,395.00",
    since: "1 Jul 2026",
  },
  {
    code: "PRD-2009",
    name: "Hydraulic hose, 1/2 in, braided",
    unit: "m",
    price: null,
    since: null,
  },
  {
    code: "PRD-2012",
    name: "Compressor belt, A-section, 42 in",
    unit: "pc",
    price: "₱320.00",
    since: "20 Sep 2025",
  },
];

const modules = [
  {
    label: "Customers",
    body: "Codes, contacts and payment terms on one record. Search finds a customer by code, name, contact or phone, and the terms follow the account everywhere it is quoted.",
  },
  {
    label: "Products",
    body: "A catalogue with a unit on every line and a current price that is always the newest dated entry — never a number typed over the last one.",
  },
  {
    label: "Price history",
    body: "Dated price rows, newest first, each with the change against the price before it. An old quote can be checked against the price that was live on its day.",
  },
];

export default function LandingPage() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "ready" && user) {
      router.replace("/dashboard");
    }
  }, [status, user, router]);

  return (
    <div className="min-h-screen bg-[color:var(--color-canvas)]">
      <header className="bg-[color:var(--color-ink)] text-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-4 lg:px-10">
          <Wordmark compact inverted />
          <nav className="flex items-center gap-2">
            <Link
              className="rounded-[12px] px-4 py-2 text-[13.5px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="rounded-[12px] bg-white px-4 py-2 text-[13.5px] font-semibold text-[color:var(--color-ink)] transition hover:bg-white/90"
              href="/register"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="landing-hero">
            <h1 className="display">Run your entire business with confidence</h1>

            <div className="mt-9 grid grid-cols-1 gap-10 lg:mt-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-16">
              <div>
                <p className="lede mt-0">
                  Hope, Inc. ERP keeps customer records, the product catalogue and every
                  dated price change in one place — so the number on the quote is the
                  number on the record.
                </p>

                <div className="hero-actions">
                  <Link className="btn btn-primary h-12 px-6" href="/login">
                    Sign in
                    <ArrowRightIcon size={16} />
                  </Link>
                  <span className="or">or</span>
                  <Link className="btn btn-secondary h-12 px-6" href="/register">
                    Register
                  </Link>
                </div>

                <p className="mt-6 text-[12.5px] text-[color:var(--color-muted)]">
                  Demo workspace · three roles · no email confirmation required
                </p>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)]">
                <div className="flex items-center justify-between gap-4 border-b border-[color:var(--color-line)] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#1d5b43]" />
                    <p className="text-[12.5px] font-semibold">Products</p>
                    <span className="text-[12px] text-[color:var(--color-muted)]">
                      11 active
                    </span>
                  </div>
                  <span className="text-[11.5px] text-[color:var(--color-muted)]">
                    as of today
                  </span>
                </div>

                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="bg-[color:var(--color-sunken)] px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-muted)]">
                        Product
                      </th>
                      <th className="bg-[color:var(--color-sunken)] px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-muted)]">
                        Unit
                      </th>
                      <th className="bg-[color:var(--color-sunken)] px-5 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-muted)]">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr className="border-t border-[#efece3]" key={row.code}>
                        <td className="px-5 py-3">
                          <p className="text-[12.5px] font-medium leading-4">{row.name}</p>
                          <p className="mt-0.5 text-[11px] text-[color:var(--color-muted)]">
                            {row.code}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-[12px] text-[color:var(--color-ink-soft)]">
                          {row.unit}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {row.price ? (
                            <>
                              <p className="text-[12.5px] font-semibold tabular-nums">{row.price}</p>
                              <p className="mt-0.5 text-[10.5px] tabular-nums text-[color:var(--color-muted)]">
                                since {row.since}
                              </p>
                            </>
                          ) : (
                            <p className="text-[11.5px] italic text-[color:var(--color-muted)]">
                              No price set
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex items-center justify-between border-t border-[color:var(--color-line)] px-5 py-3">
                  <p className="text-[11px] text-[color:var(--color-muted)]">
                    Current price = newest entry on or before today
                  </p>
                  <p className="text-[11px] font-medium text-[color:var(--color-muted)]">
                    Live record
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[color:var(--color-line)] bg-[color:var(--color-surface)]">
          <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20">
            <h2 className="max-w-[22ch] text-[30px] font-semibold leading-[1.12] tracking-[-0.035em] lg:text-[38px]">
              The records every quote depends on
            </h2>

            <dl className="mt-12 grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-3">
              {modules.map((module) => (
                <div className="border-t-2 border-[color:var(--color-ink)] pt-5" key={module.label}>
                  <dt className="text-[17px] font-semibold tracking-[-0.015em]">{module.label}</dt>
                  <dd className="mt-2.5 text-[13.5px] leading-6 text-[color:var(--color-ink-soft)]">
                    {module.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="flex flex-col items-start justify-between gap-8 rounded-[24px] bg-[color:var(--color-ink)] px-8 py-10 text-white lg:flex-row lg:items-center lg:px-12">
            <div>
              <h2 className="max-w-[24ch] text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] lg:text-[30px]">
                Open the workspace and look around.
              </h2>
              <p className="mt-2 text-[13.5px] text-white/60">
                Three demo roles: superadmin, admin and staff.
              </p>
            </div>
            <Link
              className="btn h-12 shrink-0 bg-white px-6 text-[color:var(--color-ink)] hover:bg-white/90"
              href="/login"
            >
              Sign in to the demo
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--color-line)]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-3 px-6 py-8 text-[12px] text-[color:var(--color-muted)] sm:flex-row sm:items-center lg:px-10">
          <p>© 2026 Hope, Inc. — Enterprise records</p>
          <div className="flex items-center gap-5">
            <Link className="transition hover:text-[color:var(--color-ink)]" href="/login">
              Sign in
            </Link>
            <Link className="transition hover:text-[color:var(--color-ink)]" href="/register">
              Register
            </Link>
            <Link className="transition hover:text-[color:var(--color-ink)]" href="/forgot-password">
              Reset password
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
