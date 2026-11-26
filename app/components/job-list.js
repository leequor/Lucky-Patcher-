"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JOB_PAGE_SIZE } from "../lib/job-query.mjs";
import JobForm from "./job-form";
import { getSupabaseClient } from "./supabase-client";

export default function JobList() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState("active");
  const [filters, setFilters] = useState({ search: "", status: "active" });
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [rights, setRights] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionError, setActionError] = useState("");
  const [isMutating, setIsMutating] = useState(false);
  const [state, setState] = useState({ kind: "loading", message: "" });

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setState({ kind: "error", message: "Job access is not configured." });
      return undefined;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.session) {
        router.replace("/login");
        return;
      }
      setAccessToken(data.session.access_token);
    });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!accessToken) return undefined;
    let active = true;

    fetch("/api/jobs/access", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (response) => {
        const result = await response.json();
        if (!active) return;
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok) throw new Error(result.error || "Job access could not be checked.");
        setRights({
          view: result.canViewJobs,
          add: result.canAddJobs,
          edit: result.canEditJobs,
          delete: result.canDeleteJobs,
          restore: result.canRestoreJobs,
        });
        if (!result.canViewJobs) {
          setState({ kind: "forbidden", message: "You do not have the Job view right." });
        }
      })
      .catch((error) => {
        if (active) setState({ kind: "error", message: error.message });
      });
    return () => {
      active = false;
    };
  }, [accessToken, router]);

  useEffect(() => {
    if (!accessToken || rights?.view !== true) return undefined;

    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(JOB_PAGE_SIZE),
      search: filters.search,
      status: filters.status,
    });

    async function loadJobs() {
      setState({ kind: "loading", message: "" });
      try {
        const response = await fetch(`/api/jobs?${params}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        const result = await response.json();
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok) throw new Error(result.error || "Jobs could not be loaded.");
        setJobs(result.jobs);
        setTotal(result.total);
        setState({ kind: "ready", message: "" });
      } catch (error) {
        if (error.name !== "AbortError") {
          setState({ kind: "error", message: error.message });
        }
      }
    }

    loadJobs();
    return () => controller.abort();
  }, [accessToken, filters, page, reloadKey, rights?.view, router]);

  function applyFilters(event) {
    event.preventDefault();
    setPage(1);
    setNotice("");
    setActionError("");
    setFilters({ search: searchInput.trim(), status: statusInput });
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setActionError("");
    setIsMutating(true);
    try {
      const isRestore = pendingAction.action === "restore";
      const endpoint = isRestore
        ? `/api/jobs/${encodeURIComponent(pendingAction.job.id)}/restore`
        : `/api/jobs/${encodeURIComponent(pendingAction.job.id)}`;
      const response = await fetch(endpoint, {
        method: isRestore ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) {
        setActionError(result.error || "Job could not be updated.");
        return;
      }
      setPendingAction(null);
      setNotice(isRestore ? "Job restored." : "Job moved to deleted records.");
      setReloadKey((current) => current + 1);
    } catch {
      setActionError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsMutating(false);
    }
  }

  if (state.kind === "forbidden") {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          {state.message}
        </p>
        <Link className="mt-4 inline-block text-sm font-semibold text-indigo-700" href="/">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const pageCount = Math.max(1, Math.ceil(total / JOB_PAGE_SIZE));

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-6 text-slate-800 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Human resources
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Jobs</h1>
          </div>
          <Link className="text-sm font-semibold text-indigo-700" href="/">Dashboard</Link>
        </div>

        {notice && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        {activeForm && (
          <JobForm
            accessToken={accessToken}
            job={activeForm.job}
            mode={activeForm.mode}
            onAuthExpired={() => router.replace("/login")}
            onCancel={() => setActiveForm(null)}
            onSuccess={(message) => {
              setActiveForm(null);
              setNotice(message);
              setReloadKey((current) => current + 1);
            }}
          />
        )}

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <form className="flex flex-wrap gap-2" onSubmit={applyFilters}>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Search jobs"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={statusInput}
                onChange={(event) => setStatusInput(event.target.value)}
              >
                <option value="active">Active</option>
                <option value="deleted">Deleted</option>
              </select>
              <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" type="submit">
                Search
              </button>
            </form>
            {rights?.add && (
              <button
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setActiveForm({ mode: "add", job: null })}
                type="button"
              >
                Add job
              </button>
            )}
          </div>

          {state.kind === "loading" && <p className="p-6 text-sm text-slate-600">Loading jobs...</p>}
          {state.kind === "error" && <p className="p-6 text-sm text-rose-700">{state.message}</p>}
          {state.kind === "ready" && (
            <>
              {jobs.length === 0 ? (
                <p className="p-6 text-sm text-slate-600">No jobs found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr className="border-t border-slate-100" key={job.id}>
                          <td className="px-4 py-3 font-semibold">{job.code}</td>
                          <td className="px-4 py-3">{job.title}</td>
                          <td className="max-w-md px-4 py-3 text-slate-600">{job.description || "-"}</td>
                          <td className="px-4 py-3 text-right">
                            {filters.status === "deleted" ? (
                              rights?.restore && (
                                <button
                                  className="text-sm font-semibold text-emerald-700"
                                  onClick={() => setPendingAction({ action: "restore", job })}
                                  type="button"
                                >
                                  Restore
                                </button>
                              )
                            ) : (
                              <>
                                {rights?.edit && (
                                  <button
                                    className="mr-3 text-sm font-semibold text-indigo-700"
                                    onClick={() => setActiveForm({ mode: "edit", job })}
                                    type="button"
                                  >
                                    Edit
                                  </button>
                                )}
                                {rights?.delete && (
                                  <button
                                    className="text-sm font-semibold text-rose-700"
                                    onClick={() => setPendingAction({ action: "delete", job })}
                                    type="button"
                                  >
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
                <span>{total} job(s)</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} type="button">
                    Previous
                  </button>
                  <span>Page {page} of {pageCount}</span>
                  <button disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)} type="button">
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {pendingAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold">
                {pendingAction.action === "restore" ? "Restore job?" : "Delete job?"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {pendingAction.job.title} ({pendingAction.job.code})
              </p>
              {actionError && <p className="mt-3 text-sm text-rose-700">{actionError}</p>}
              <div className="mt-5 flex justify-end gap-3">
                <button
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                  onClick={() => setPendingAction(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={isMutating}
                  onClick={confirmAction}
                  type="button"
                >
                  {isMutating
                    ? "Working..."
                    : pendingAction.action === "restore"
                      ? "Restore"
                      : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
