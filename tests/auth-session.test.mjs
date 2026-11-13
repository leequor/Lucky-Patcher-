import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
  key(index) {
    return [...this.map.keys()][index] ?? null;
  }
  get length() {
    return this.map.size;
  }
}

globalThis.window = { localStorage: new MemoryStorage() };

const auth = await import("../lib/auth/session.js");
const { resetWorkspace, getState } = await import("../lib/data/storage.js");
const { DEMO_ACCOUNTS, DEMO_PASSWORD } = await import("../lib/data/seed.js");

const ada = DEMO_ACCOUNTS[0];

beforeEach(async () => {
  await resetWorkspace();
  await auth.signOut();
});

describe("Sign in", () => {
  it("accepts a demo account with the right password", async () => {
    const session = await auth.signIn(ada.email, DEMO_PASSWORD);
    assert.equal(session.user.email, ada.email);
    assert.equal(session.user.role, "superadmin");
    assert.ok(session.expiresAt);
  });

  it("rejects a wrong password with a generic message", async () => {
    await assert.rejects(
      () => auth.signIn(ada.email, "wrong-password"),
      (error) => {
        assert.equal(error.code, "invalid_credentials");
        assert.equal(error.message, "Invalid email or password. Please try again.");
        return true;
      },
    );
  });

  it("rejects an unknown email without revealing that it is unknown", async () => {
    await assert.rejects(
      () => auth.signIn("nobody@hopeinc.demo", "whatever"),
      (error) => error.message === "Invalid email or password. Please try again.",
    );
  });

  it("is case-insensitive on the email", async () => {
    const session = await auth.signIn(ada.email.toUpperCase(), DEMO_PASSWORD);
    assert.equal(session.user.id, ada.id);
  });
});

describe("Session lifecycle", () => {
  it("returns the session while it is valid", async () => {
    await auth.signIn(ada.email, DEMO_PASSWORD);
    const session = await auth.getSession();
    assert.equal(session.user.id, ada.id);
  });

  it("clears the session on sign out", async () => {
    await auth.signIn(ada.email, DEMO_PASSWORD);
    await auth.signOut();
    assert.equal(await auth.getSession(), null);
    assert.equal(window.localStorage.getItem("hope-erp.session.v1"), null);
  });

  it("treats an expired session as signed out", async () => {
    await auth.signIn(ada.email, DEMO_PASSWORD);
    const stored = JSON.parse(window.localStorage.getItem("hope-erp.session.v1"));
    stored.expiresAt = new Date(Date.now() - 1000).toISOString();
    window.localStorage.setItem("hope-erp.session.v1", JSON.stringify(stored));

    assert.equal(await auth.getSession(), null);
  });

  it("never stores the password in plain text", async () => {
    await auth.signIn(ada.email, DEMO_PASSWORD);
    const workspace = window.localStorage.getItem("hope-erp.workspace.v1");
    const session = window.localStorage.getItem("hope-erp.session.v1");

    assert.equal(workspace.includes(DEMO_PASSWORD), false);
    assert.equal(session.includes(DEMO_PASSWORD), false);
    assert.match(workspace, /"passwordHash":"(pbkdf2|weak)\$/);
  });
});

describe("Registration", () => {
  it("creates an account, hashes the password and signs the user in", async () => {
    const result = await auth.register({
      name: "New Person",
      email: "new@hopeinc.demo",
      password: "secret123",
      confirmPassword: "secret123",
    });

    assert.equal(result.user.email, "new@hopeinc.demo");
    const session = await auth.getSession();
    assert.equal(session.user.id, result.user.id);

    const state = await getState();
    const stored = state.users.find((user) => user.email === "new@hopeinc.demo");
    assert.ok(stored.passwordHash.startsWith("pbkdf2$"));
    assert.equal(stored.passwordHash.includes("secret123"), false);
  });

  it("rejects a duplicate email", async () => {
    await assert.rejects(
      () =>
        auth.register({
          name: "Copy Cat",
          email: ada.email,
          password: "secret123",
          confirmPassword: "secret123",
        }),
      (error) => error.code === "email_exists",
    );
  });

  it("rejects mismatched passwords", async () => {
    await assert.rejects(
      () =>
        auth.register({
          name: "New Person",
          email: "mismatch@hopeinc.demo",
          password: "secret123",
          confirmPassword: "secret124",
        }),
      (error) => error.code === "validation" && Boolean(error.errors.confirmPassword),
    );
  });
});

describe("Password reset", () => {
  it("returns a generic message for an unknown email and no token", async () => {
    const result = await auth.requestPasswordReset("nobody@hopeinc.demo");
    assert.equal(result.token, null);
    assert.match(result.message, /If an account exists/);
  });

  it("issues a single-use token that changes the password", async () => {
    const { token } = await auth.requestPasswordReset(ada.email);
    assert.ok(token);

    const inspected = await auth.inspectResetToken(token);
    assert.equal(inspected.valid, true);

    await auth.resetPassword(token, "brand-new-password");

    await assert.rejects(
      () => auth.signIn(ada.email, DEMO_PASSWORD),
      (error) => error.code === "invalid_credentials",
    );
    const session = await auth.signIn(ada.email, "brand-new-password");
    assert.equal(session.user.id, ada.id);
  });

  it("rejects a used token", async () => {
    const { token } = await auth.requestPasswordReset(ada.email);
    await auth.resetPassword(token, "brand-new-password");

    const inspected = await auth.inspectResetToken(token);
    assert.equal(inspected.valid, false);
    assert.equal(inspected.reason, "used");

    await assert.rejects(
      () => auth.resetPassword(token, "another-password"),
      (error) => error.code === "used_token",
    );
  });

  it("rejects an expired token", async () => {
    const { token } = await auth.requestPasswordReset(ada.email);
    const state = await getState();
    const record = state.resetTokens.find((row) => row.token === token);
    record.expiresAt = new Date(Date.now() - 1000).toISOString();

    const inspected = await auth.inspectResetToken(token);
    assert.equal(inspected.valid, false);
    assert.equal(inspected.reason, "expired");
  });

  it("rejects an unknown token", async () => {
    const inspected = await auth.inspectResetToken("not-a-real-token");
    assert.equal(inspected.valid, false);
    assert.equal(inspected.reason, "invalid");
  });

  it("signs out open sessions when the password changes", async () => {
    await auth.signIn(ada.email, DEMO_PASSWORD);
    const { token } = await auth.requestPasswordReset(ada.email);
    await auth.resetPassword(token, "brand-new-password");
    assert.equal(await auth.getSession(), null);
  });
});
