import { createSeedState } from "./seed.js";

const STORAGE_KEY = "hope-erp.workspace.v1";
const SCHEMA_VERSION = 2;

let state = null;
let loading = null;

export class AppError extends Error {
  constructor(message, { code = "error", field = null, status = 400, errors = null } = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.field = field;
    this.status = status;
    this.errors = errors;
  }
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

async function buildInitialState() {
  const { hashPassword } = await import("../auth/crypto.js");
  const { DEMO_ACCOUNTS, DEMO_PASSWORD } = await import("./seed.js");
  const seeded = createSeedState();

  const users = await Promise.all(
    DEMO_ACCOUNTS.map(async (account) => ({
      ...account,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      createdAt: "2026-01-04T00:00:00.000Z",
    })),
  );

  return { ...seeded, version: SCHEMA_VERSION, users };
}

export function persist() {
  if (!isBrowser() || !state) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode). The in-memory copy still works
    // for this session, so the app stays usable.
  }
}

export async function getState() {
  if (state) return state;
  if (loading) return loading;

  loading = (async () => {
    if (isBrowser()) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.version === SCHEMA_VERSION && Array.isArray(parsed.customers)) {
            state = parsed;
            return state;
          }
        } catch {
          // Corrupt payload: rebuild below.
        }
      }
    }

    state = await buildInitialState();
    persist();
    return state;
  })();

  return loading;
}

export async function resetWorkspace() {
  if (isBrowser()) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  state = null;
  loading = null;
  return getState();
}

export function newId(prefix) {
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}_${random}`;
}

export function nowISO() {
  return new Date().toISOString();
}
