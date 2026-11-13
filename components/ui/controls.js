"use client";

import Link from "next/link";
import { useId } from "react";
import { SearchIcon, CloseIcon } from "./icons";

/* ------------------------------- Button ------------------------------- */

const VARIANTS = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  ghost: "btn btn-ghost",
  danger: "btn btn-danger",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  className = "",
  type = "button",
  ...props
}) {
  const classes = `${VARIANTS[variant] ?? VARIANTS.primary} ${size === "sm" ? "btn-sm" : ""} ${className}`.trim();

  if (href) {
    return (
      <Link className={classes} href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = "", ...props }) {
  return (
    <button
      aria-label={label}
      className={`btn btn-ghost btn-icon ${className}`.trim()}
      title={label}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

/* -------------------------------- Field ------------------------------- */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  className = "",
  children,
}) {
  return (
    <div className={`field ${className}`.trim()}>
      {label ? (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required ? <span className="req"> · required</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="error-text" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="hint" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ id, error, className = "", ...props }) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <input
      aria-describedby={error ? `${inputId}-error` : undefined}
      aria-invalid={error ? "true" : undefined}
      className={`input ${className}`.trim()}
      id={inputId}
      {...props}
    />
  );
}

export function Textarea({ id, error, className = "", ...props }) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <textarea
      aria-describedby={error ? `${inputId}-error` : undefined}
      aria-invalid={error ? "true" : undefined}
      className={`textarea ${className}`.trim()}
      id={inputId}
      {...props}
    />
  );
}

export function Select({ id, error, children, className = "", ...props }) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <select
      aria-describedby={error ? `${inputId}-error` : undefined}
      aria-invalid={error ? "true" : undefined}
      className={`select ${className}`.trim()}
      id={inputId}
      {...props}
    >
      {children}
    </select>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search", label = "Search" }) {
  return (
    <div className="search">
      <span className="search-icon">
        <SearchIcon size={17} />
      </span>
      <input
        aria-label={label}
        className="input"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {value ? (
        <button
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[color:var(--color-muted)] transition hover:bg-[#e8e6de] hover:text-[color:var(--color-ink)]"
          onClick={() => onChange("")}
          type="button"
        >
          <CloseIcon size={14} />
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------- Badges ------------------------------- */

export function StatusBadge({ status, isDeleted }) {
  if (isDeleted) {
    return <span className="badge badge-deleted">Deleted</span>;
  }
  return (
    <span className={`badge ${status === "active" ? "badge-active" : "badge-inactive"}`}>
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}

export function Badge({ children, tone = "plain" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
