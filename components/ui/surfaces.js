"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "./icons";
import { avatarTone, initials } from "@/lib/domain/format";

/* -------------------------------- Card -------------------------------- */

export function Card({ children, className = "", ...props }) {
  return (
    <section className={`card ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}

export function CardHead({ title, description, action }) {
  return (
    <div className="card-head">
      <div>
        <h2 className="card-title">{title}</h2>
        {description ? <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ----------------------------- Page header ---------------------------- */

export function PageHeader({ title, description, actions, breadcrumb }) {
  return (
    <header className="page-head">
      <div className="min-w-0">
        {breadcrumb}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-sub">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
    </header>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-[12.5px] text-[color:var(--color-muted)]">
      {items.map((item, index) => (
        <span className="flex items-center gap-2" key={`${item.label}-${index}`}>
          {index > 0 ? <span aria-hidden="true">/</span> : null}
          {item.href ? (
            <Link className="transition hover:text-[color:var(--color-ink)]" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="text-[color:var(--color-ink-soft)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ------------------------------ Empty state --------------------------- */

export function EmptyState({ title, body, action }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {body ? <p className="empty-body">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* -------------------------------- Avatar ------------------------------ */

export function Avatar({ name, size = 32 }) {
  const tone = avatarTone(name ?? "");
  return (
    <span
      aria-hidden="true"
      className="avatar"
      style={{
        background: tone.background,
        color: tone.color,
        width: size,
        height: size,
        fontSize: size <= 28 ? 11 : 12,
      }}
    >
      {initials(name)}
    </span>
  );
}

/* ------------------------------- Skeleton ----------------------------- */

export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div aria-hidden="true" className="px-5 py-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="flex items-center gap-6 py-4" key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <div
              className="skeleton h-3.5"
              key={columnIndex}
              style={{ width: columnIndex === 0 ? 90 : `${100 / columns}%`, maxWidth: 200 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- Pagination --------------------------- */

export function Pagination({ page, pageCount, total, pageSize, onPage, unit = "records" }) {
  if (total === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--color-line)] px-5 py-3.5">
      <p className="text-[12.5px] text-[color:var(--color-muted)]" data-numeric>
        Showing {start}–{end} of {total} {unit}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          className="btn btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          type="button"
        >
          <ArrowLeftIcon size={15} />
          Previous
        </button>
        <span className="px-2 text-[12.5px] text-[color:var(--color-muted)]" data-numeric>
          {page} / {pageCount}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          type="button"
        >
          Next
          <ArrowRightIcon size={15} />
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- Modal ------------------------------ */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, description, children, footer, labelledBy }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      // Prefer the first field so typing can start immediately.
      const field = panel.querySelector("input, select, textarea");
      (field ?? panel).focus();
    }, 30);

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null,
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby={labelledBy ?? "modal-title"}
        aria-modal="true"
        className="modal"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-6 px-6 pb-4 pt-6">
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.02em]" id={labelledBy ?? "modal-title"}>
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 text-[13.5px] leading-6 text-[color:var(--color-muted)]">{description}</p>
            ) : null}
          </div>
          <button
            aria-label="Close dialog"
            className="btn btn-ghost btn-icon shrink-0"
            onClick={onClose}
            type="button"
          >
            <CloseIcon size={17} />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
        {footer ? <div className="border-t border-[color:var(--color-line)] px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
