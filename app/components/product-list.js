"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "../lib/list-query.mjs";
import { getSupabaseClient } from "./supabase-client";

function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function ProductList() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [canViewProducts, setCanViewProducts] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [unitInput, setUnitInput] = useState("");
  const [statusInput, setStatusInput] = useState("active");
  const [filters, setFilters] = useState({ search: "", unit: "", status: "active" });
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState({ kind: "loading", message: "" });

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();

    if (!supabase) {
      setState({
        kind: "error",
        message: "Product access is not configured. Add the Supabase URL and anon key.",
      });
      return () => {
        active = false;
      };
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setState({
            kind: "error",
            message: "We couldn't check your sign-in status. Please refresh.",
          });
          return;
        }
        if (!data.session) {
          router.replace("/login");
          return;
        }
        setAccessToken(data.session.access_token);
      })
      .catch(() => {
        if (active) {
          setState({
            kind: "error",
            message: "We couldn't check your sign-in status. Please refresh.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!accessToken) return undefined;

    let active = true;

    async function checkAccess() {
      try {
        const response = await fetch("/api/products/access", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = await response.json();

        if (!active) return;
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok) {
          throw new Error(result.error || "Product access could not be checked.");
        }

        setCanViewProducts(result.canViewProducts === true);
        if (result.canViewProducts !== true) {
          setState({
            kind: "forbidden",
            message: "You do not have the Product view right.",
          });
        }
      } catch (error) {
        if (active) {
          setState({
            kind: "error",
            message: error.message || "Product access could not be checked.",
          });
        }
      }
    }

    checkAccess();
    return () => {
      active = false;
    };
  }, [accessToken, router]);

  useEffect(() => {
    if (!accessToken || canViewProducts !== true) return undefined;

    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(DEFAULT_PAGE_SIZE),
      search: filters.search,
      unit: filters.unit,
      status: filters.status,
    });

    async function loadProducts() {
      setState({ kind: "loading", message: "" });

      try {
        const response = await fetch(`/api/products?${params}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        const result = await response.json();

        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (response.status === 403) {
          setProducts([]);
          setTotal(0);
          setCanViewProducts(false);
          setState({ kind: "forbidden", message: result.error });
          return;
        }
        if (!response.ok) {
          throw new Error(result.error || "Products could not be loaded. Please try again.");
        }

        setProducts(result.products);
        setTotal(result.total);
        setState({ kind: "ready", message: "" });
      } catch (error) {
        if (error.name === "AbortError") return;
        setState({
          kind: "error",
          message: error.message || "Products could not be loaded. Please try again.",
        });
      }
    }

    loadProducts();
    return () => controller.abort();
  }, [accessToken, canViewProducts, filters, page, router]);

  function applyFilters(event) {
    event.preventDefault();
    setPage(1);
    setFilters({
      search: searchInput.trim(),
      unit: unitInput.trim(),
      status: statusInput,
    });
  }

  const pageCount = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-800 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <Link className="text-sm font-medium text-indigo-700 hover:text-indigo-900" href="/">
            &larr; Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Products
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse products and their current prices.
          </p>
        </header>

        {state.kind === "forbidden" ? (
          <section
            className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm"
            role="alert"
          >
            <h2 className="font-semibold text-slate-900">Product access denied</h2>
            <p className="mt-2 text-sm text-slate-600">
              {state.message || "You do not have the Product view right."}
            </p>
            <Link className="mt-4 inline-block text-sm font-semibold text-indigo-700" href="/">
              Return to dashboard
            </Link>
          </section>
        ) : (
          <>
            <form
              className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(14rem,2fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_auto]"
              onSubmit={applyFilters}
            >
              <label className="text-sm font-medium text-slate-700">
                Search
                <input
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  maxLength={100}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Product code or description"
                  type="search"
                  value={searchInput}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Unit
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  maxLength={40}
                  onChange={(event) => setUnitInput(event.target.value)}
                  placeholder="Filter by unit"
                  value={unitInput}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Status
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  onChange={(event) => setStatusInput(event.target.value)}
                  value={statusInput}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="all">All statuses</option>
                </select>
              </label>

              <button
                className="self-end rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300"
                type="submit"
              >
                Apply filters
              </button>
            </form>

            {state.kind === "error" && (
              <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
                {state.message}
              </p>
            )}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
                <h2 className="font-semibold text-slate-900">Product list</h2>
                <p className="text-sm text-slate-500">
                  {state.kind === "loading"
                    ? "Loading products..."
                    : `${total} ${total === 1 ? "product" : "products"}`}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold" scope="col">Code</th>
                      <th className="px-5 py-3 font-semibold" scope="col">Description</th>
                      <th className="px-5 py-3 font-semibold" scope="col">Unit</th>
                      <th className="px-5 py-3 text-right font-semibold" scope="col">Current price</th>
                      <th className="px-5 py-3 font-semibold" scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                          {product.code}
                        </td>
                        <td className="px-5 py-4 text-slate-800">{product.description}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">{product.unit}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-slate-700">
                          {formatPrice(product.current_price)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              String(product.status).toLowerCase() === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {state.kind === "ready" && products.length === 0 && (
                      <tr>
                        <td className="px-5 py-12 text-center text-slate-500" colSpan={5}>
                          No products match these filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 sm:px-6">
                <p className="text-sm text-slate-500">
                  Page {page} of {pageCount}
                </p>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={page <= 1 || state.kind === "loading"}
                    onClick={() => setPage((currentPage) => currentPage - 1)}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={page >= pageCount || state.kind === "loading"}
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
