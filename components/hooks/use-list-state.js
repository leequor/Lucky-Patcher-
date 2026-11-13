"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** List filters kept in React state and mirrored into the URL. */
export function useListState(defaults, initial = null) {
  const router = useRouter();
  const [state, setState] = useState(() => {
    const next = { ...defaults };
    if (initial) {
      Object.keys(defaults).forEach((key) => {
        const raw = initial[key];
        if (raw === undefined || raw === null || raw === "") return;
        next[key] = key === "page" ? Math.max(1, Number(raw) || 1) : String(raw);
      });
    }
    return next;
  });

  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    const params = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      if (key === "page" && Number(value) === 1) return;
      if (value === "" || value === "all" || value === null) return;
      params.set(key, String(value));
    });

    const query = params.toString();
    const path = typeof window === "undefined" ? "" : window.location.pathname;
    router.replace(query ? `${path}?${query}` : path, { scroll: false });
  }, [state, router]);

  function setFilter(key, value) {
    setState((current) => ({
      ...current,
      [key]: value,
      ...(key === "page" ? {} : { page: 1 }),
    }));
  }

  function setPage(page) {
    setState((current) => ({ ...current, page }));
  }

  function reset() {
    setState({ ...defaults });
  }

  const isFiltered = Object.keys(defaults).some((key) => {
    if (key === "page" || key === "sort") return false;
    return state[key] !== defaults[key];
  });

  return { state, setFilter, setPage, reset, isFiltered };
}

/** Debounce a fast-changing value (search boxes). */
export function useDebounced(value, delay = 320) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
