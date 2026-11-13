"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useAsyncData } from "@/components/hooks/use-async-data";
import { useDebounced, useListState } from "@/components/hooks/use-list-state";
import { NoAccess } from "@/components/shell/no-access";
import {
  Avatar,
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  TableSkeleton,
} from "@/components/ui/surfaces";
import { Button, SearchInput, Select } from "@/components/ui/controls";
import { listAudit } from "@/lib/data/store";
import { AUDIT_ACTION_LABELS, PERMISSIONS } from "@/lib/domain/constants";
import { formatDateTime, relativeTime } from "@/lib/domain/format";

const DEFAULTS = { q: "", entity: "all", page: 1 };

export default function ActivityView({ initial }) {
  const { can } = useAuth();
  const { state, setFilter, setPage, reset } = useListState(DEFAULTS, initial);
  const [search, setSearch] = useState(state.q);
  const debouncedSearch = useDebounced(search);

  useEffect(() => {
    if (debouncedSearch !== state.q) setFilter("q", debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = useAsyncData(
    () => listAudit({ q: state.q, entity: state.entity, page: state.page, pageSize: 12 }),
    [state.q, state.entity, state.page],
  );

  if (!can(PERMISSIONS.AUDIT_VIEW)) {
    return (
      <NoAccess
        description="The activity log is limited to roles with the audit right. Admins can read it; staff cannot."
        title="The activity log is not available to your role"
      />
    );
  }

  const data = query.data;
  const rows = data?.rows ?? [];

  return (
    <div className="page">
      <PageHeader
        description="Every create, edit, delete, restore and price change, with the user who made it."
        title="Activity"
      />

      <Card className="overflow-hidden">
        <div className="toolbar">
          <SearchInput
            label="Search the activity log"
            onChange={setSearch}
            placeholder="Search person, record or detail"
            value={search}
          />

          <Select
            aria-label="Filter by record type"
            onChange={(event) => setFilter("entity", event.target.value)}
            value={state.entity}
          >
            <option value="all">All records</option>
            <option value="customer">Customers</option>
            <option value="product">Products</option>
            <option value="price">Prices</option>
          </Select>

          {state.entity !== "all" || state.q ? (
            <button
              className="text-[12.5px] font-medium text-[color:var(--color-muted)] underline decoration-[color:var(--color-line-strong)] underline-offset-[3px] transition hover:text-[color:var(--color-ink)]"
              onClick={() => {
                reset();
                setSearch("");
              }}
              type="button"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {query.loading && !data ? (
          <TableSkeleton columns={4} rows={8} />
        ) : rows.length === 0 ? (
          <EmptyState
            action={
              <Button
                onClick={() => {
                  reset();
                  setSearch("");
                }}
                variant="secondary"
              >
                Clear filters
              </Button>
            }
            body="Nothing matches this filter. Every change made in the workspace appears here."
            title="No activity matches"
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-[104px] sm:w-[180px]">When</th>
                    <th className="hidden w-[180px] sm:table-cell">Who</th>
                    <th className="hidden w-[170px] md:table-cell">Action</th>
                    <th>Record</th>
                    <th className="hidden lg:table-cell">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <span className="block whitespace-nowrap text-[13px] tabular-nums">
                          {relativeTime(entry.at)}
                        </span>
                        <span className="cell-sub hidden sm:block">{formatDateTime(entry.at)}</span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="flex items-center gap-2.5">
                          <Avatar name={entry.actorName} size={28} />
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium">
                              {entry.actorName}
                            </span>
                            <span className="block text-[11.5px] text-[color:var(--color-muted)]">
                              {entry.actorEmail}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="hidden text-[12.5px] text-[color:var(--color-ink-soft)] md:table-cell">
                        {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                      </td>
                      <td>
                        <span className="block text-[13px] font-medium">{entry.entityLabel}</span>
                        <span className="cell-sub">
                          <span className="sm:hidden">{entry.actorName} · </span>
                          {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                          <span className="hidden sm:inline capitalize"> · {entry.entity}</span>
                        </span>
                      </td>
                      <td className="hidden max-w-[360px] text-[12.5px] text-[color:var(--color-muted)] lg:table-cell">
                        {entry.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              onPage={setPage}
              page={data.page}
              pageCount={data.pageCount}
              pageSize={data.pageSize}
              total={data.total}
              unit="entries"
            />
          </>
        )}
      </Card>
    </div>
  );
}
