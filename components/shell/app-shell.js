"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../providers/auth-provider";
import { Avatar } from "../ui/surfaces";
import {
  BoxIcon,
  ClockIcon,
  GridIcon,
  LogoutIcon,
  UsersIcon,
  CloseIcon,
} from "../ui/icons";
import { ROLE_LABELS, PERMISSIONS } from "@/lib/domain/constants";

function BrandMark({ size = 26 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M4 17.5h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M7 17.5a5 5 0 0 1 10 0"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 3.5v3M5.4 6.9l2 2M18.6 6.9l-2 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function Wordmark({ compact = false, inverted = false }) {
  return (
    <Link className="flex items-center gap-2.5" href="/">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-[11px] ${
          inverted ? "bg-white text-[color:var(--color-ink)]" : "bg-[color:var(--color-ink)] text-white"
        }`}
      >
        <BrandMark size={20} />
      </span>
      <span className="leading-tight">
        <span
          className={`block text-[15px] font-semibold tracking-[-0.02em] ${
            inverted ? "text-white" : ""
          }`}
        >
          Hope, Inc.
        </span>
        <span
          className={`block text-[11px] font-medium uppercase tracking-[0.14em] ${
            inverted ? "text-white/50" : "text-[color:var(--color-muted)]"
          }`}
        >
          {compact ? "ERP" : "Enterprise records"}
        </span>
      </span>
    </Link>
  );
}

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [{ href: "/dashboard", label: "Overview", icon: GridIcon }],
  },
  {
    label: "Records",
    items: [
      { href: "/customers", label: "Customers", icon: UsersIcon, permission: PERMISSIONS.CUSTOMER_VIEW },
      { href: "/products", label: "Products", icon: BoxIcon, permission: PERMISSIONS.PRODUCT_VIEW },
    ],
  },
  {
    label: "System",
    items: [{ href: "/activity", label: "Activity", icon: ClockIcon, permission: PERMISSIONS.AUDIT_VIEW }],
  },
];

function NavList({ onNavigate }) {
  const pathname = usePathname();
  const { can } = useAuth();

  return (
    <nav aria-label="Main" className="space-y-7">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter(
          (item) => !item.permission || can(item.permission),
        );
        if (items.length === 0) return null;

        return (
          <div key={group.label}>
            <p className="nav-group-label">{group.label}</p>
            <ul className="space-y-1">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className="nav-item"
                      data-active={active}
                      href={item.href}
                      onClick={onNavigate}
                    >
                      <Icon size={17} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function UserBlock() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
    } finally {
      // A full navigation, not a client-side route change: it clears any
      // cached authenticated render and makes Back land on the login screen.
      window.location.assign("/login?signedOut=1");
    }
  }

  return (
    <div className="border-t border-[color:var(--color-line)] p-3">
      <div className="flex items-center gap-2.5 rounded-[14px] px-1 py-1">
        <Avatar name={user?.name} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-4">{user?.name}</p>
          <p className="truncate text-[11.5px] text-[color:var(--color-muted)]">
            {ROLE_LABELS[user?.role] ?? "Staff"}
          </p>
        </div>
        <button
          aria-label="Sign out"
          className="btn btn-ghost btn-icon"
          disabled={busy}
          onClick={handleSignOut}
          title="Sign out"
          type="button"
        >
          <LogoutIcon size={17} />
        </button>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const { status, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (status === "ready" && !user) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    }
  }, [status, user, pathname, router]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-[13px] text-[color:var(--color-muted)]">
          <span className="skeleton h-2.5 w-2.5 rounded-full" />
          Opening your workspace…
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-4 py-6 lg:flex">
        <div className="px-2">
          <Wordmark />
        </div>
        <div className="mt-9 flex-1 overflow-y-auto">
          <NavList />
        </div>
        <UserBlock />
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[color:var(--color-line)] bg-[color:var(--color-surface)]/95 px-5 py-3 backdrop-blur lg:hidden">
          <Wordmark compact />
          <button
            aria-expanded={drawerOpen}
            aria-label="Open menu"
            className="btn btn-secondary btn-icon"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <svg fill="none" height="18" viewBox="0 0 24 24" width="18" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
          </button>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[rgba(22,20,15,0.38)]"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[280px] flex-col bg-[color:var(--color-surface)] px-4 py-5">
            <div className="flex items-center justify-between px-1">
              <Wordmark compact />
              <button
                aria-label="Close menu"
                className="btn btn-ghost btn-icon"
                onClick={() => setDrawerOpen(false)}
                type="button"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="mt-7 flex-1 overflow-y-auto">
              <NavList onNavigate={() => setDrawerOpen(false)} />
            </div>
            <UserBlock />
          </div>
        </div>
      ) : null}
    </div>
  );
}
