import { getState, persist, newId, nowISO, AppError } from "../data/storage.js";
import { hashPassword, verifyPassword } from "./crypto.js";
import { normalizeText, validateRegistration } from "../domain/validation.js";
import { ROLES } from "../domain/constants.js";

const SESSION_KEY = "hope-erp.session.v1";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const RESET_TTL_MS = 15 * 60 * 1000;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function readStoredSession() {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.userId || !parsed?.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(session) {
  if (!isBrowser()) return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function getSession() {
  const stored = readStoredSession();
  if (!stored) return null;

  const state = await getState();
  const user = state.users.find((row) => row.id === stored.userId);
  if (!user) {
    writeStoredSession(null);
    return null;
  }

  return { user: publicUser(user), expiresAt: stored.expiresAt };
}

export async function signIn(email, password) {
  const cleanEmail = normalizeText(email).toLowerCase();
  const state = await getState();
  const user = state.users.find((row) => row.email.toLowerCase() === cleanEmail);

  const genericError = new AppError("Invalid email or password. Please try again.", {
    code: "invalid_credentials",
    status: 401,
  });

  if (!user) {
    // Run a hash anyway so a missing account and a wrong password take a
    // similar amount of time.
    await hashPassword(String(password ?? "x"));
    throw genericError;
  }

  const matches = await verifyPassword(String(password ?? ""), user.passwordHash);
  if (!matches) throw genericError;

  const session = {
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    startedAt: nowISO(),
  };
  writeStoredSession(session);

  return { user: publicUser(user), expiresAt: session.expiresAt };
}

export async function signOut() {
  writeStoredSession(null);
  return true;
}

export async function register({ name, email, password, confirmPassword }) {
  const validation = validateRegistration({ name, email, password, confirmPassword });
  if (!validation.ok) {
    throw new AppError("Check the highlighted fields and try again.", {
      code: "validation",
      status: 422,
      errors: validation.errors,
    });
  }

  const state = await getState();
  const cleanEmail = normalizeText(email).toLowerCase();

  if (state.users.some((row) => row.email.toLowerCase() === cleanEmail)) {
    throw new AppError("An account with this email already exists. Try signing in instead.", {
      code: "email_exists",
      status: 409,
      errors: { email: "An account with this email already exists." },
    });
  }

  const user = {
    id: newId("usr"),
    name: normalizeText(name),
    email: cleanEmail,
    role: ROLES.SUPERADMIN,
    passwordHash: await hashPassword(password),
    createdAt: nowISO(),
  };

  state.users.push(user);
  persist();

  const session = {
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    startedAt: nowISO(),
  };
  writeStoredSession(session);

  return { user: publicUser(user), expiresAt: session.expiresAt };
}

/**
 * Demo password reset. A real deployment sends this by email through Supabase.
 * The token is returned so the UI can offer the link in the demo workspace.
 */
export async function requestPasswordReset(email) {
  const cleanEmail = normalizeText(email).toLowerCase();
  const state = await getState();
  const user = state.users.find((row) => row.email.toLowerCase() === cleanEmail);

  const genericMessage =
    "If an account exists for this email, password reset instructions have been sent.";

  if (!user) {
    return { message: genericMessage, token: null };
  }

  const token = {
    id: newId("rst"),
    token: newId("tok").replace("tok_", ""),
    userId: user.id,
    createdAt: nowISO(),
    expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    usedAt: null,
  };

  state.resetTokens = [token, ...(state.resetTokens ?? [])].slice(0, 30);
  persist();

  return { message: genericMessage, token: token.token };
}

export async function inspectResetToken(token) {
  const state = await getState();
  const record = (state.resetTokens ?? []).find((row) => row.token === token);

  if (!record) {
    return {
      valid: false,
      reason: "invalid",
      message: "This reset link is invalid, expired, or already used. Request a new one.",
    };
  }
  if (record.usedAt) {
    return {
      valid: false,
      reason: "used",
      message: "This reset link was already used. Request a new one.",
    };
  }
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    return {
      valid: false,
      reason: "expired",
      message: "This reset link has expired. Request a new one.",
    };
  }

  const user = state.users.find((row) => row.id === record.userId);
  return { valid: true, email: user?.email ?? "", expiresAt: record.expiresAt };
}

export async function resetPassword(token, password) {
  const state = await getState();
  const record = (state.resetTokens ?? []).find((row) => row.token === token);

  if (!record) {
    throw new AppError(
      "This reset link is invalid, expired, or already used. Request a new one.",
      { code: "invalid_token", status: 400 },
    );
  }
  if (record.usedAt) {
    throw new AppError("This reset link was already used. Request a new one.", {
      code: "used_token",
      status: 400,
    });
  }
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    throw new AppError("This reset link has expired. Request a new one.", {
      code: "expired_token",
      status: 400,
    });
  }
  if (String(password ?? "").length < 6) {
    throw new AppError("Check the highlighted fields and try again.", {
      code: "validation",
      status: 422,
      errors: { password: "Use at least 6 characters." },
    });
  }

  const user = state.users.find((row) => row.id === record.userId);
  if (!user) {
    throw new AppError("This account no longer exists.", { code: "not_found", status: 404 });
  }

  user.passwordHash = await hashPassword(password);
  record.usedAt = nowISO();
  persist();

  writeStoredSession(null);

  return true;
}

export async function changePassword(userId, currentPassword, newPassword) {
  const state = await getState();
  const user = state.users.find((row) => row.id === userId);
  if (!user) throw new AppError("Account not found.", { code: "not_found", status: 404 });

  const matches = await verifyPassword(currentPassword, user.passwordHash);
  if (!matches) {
    throw new AppError("Your current password is not correct.", {
      code: "invalid_credentials",
      status: 401,
      errors: { currentPassword: "Your current password is not correct." },
    });
  }

  user.passwordHash = await hashPassword(newPassword);
  persist();
  return true;
}
