"use client";

import Link from "next/link";
import { Card } from "../ui/surfaces";
import { Button } from "../ui/controls";
import { ShieldIcon } from "../ui/icons";
import { useAuth } from "../providers/auth-provider";
import { ROLE_LABELS } from "@/lib/domain/constants";

export function NoAccess({ title = "You do not have access to this page", description }) {
  const { user } = useAuth();

  return (
    <div className="page">
      <Card className="mx-auto max-w-xl px-8 py-12 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f1efe8] text-[color:var(--color-ink-soft)]">
          <ShieldIcon size={20} />
        </span>
        <h1 className="mt-5 text-[20px] font-semibold tracking-[-0.02em]">{title}</h1>
        <p className="mx-auto mt-2 max-w-[46ch] text-[13.5px] leading-6 text-[color:var(--color-muted)]">
          {description ??
            `Your role (${ROLE_LABELS[user?.role] ?? "staff"}) does not include this right. Ask an admin to grant it, then sign in again.`}
        </p>
        <div className="mt-6 flex justify-center gap-2.5">
          <Button href="/dashboard" variant="secondary">
            Back to overview
          </Button>
        </div>
      </Card>
    </div>
  );
}
