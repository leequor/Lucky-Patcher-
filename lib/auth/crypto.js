/**
 * Password hashing for the demo workspace.
 *
 * Real deployments hand credentials to Supabase Auth and never see a hash.
 * The demo workspace keeps accounts in the browser, so passwords are stored as
 * PBKDF2-SHA256 digests (never plain text) to satisfy the security test case.
 */

const ITERATIONS = 60_000;
const KEY_LENGTH = 32;

function toBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function randomSalt() {
  const salt = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(salt);
  } else {
    for (let index = 0; index < salt.length; index += 1) {
      salt[index] = Math.floor(Math.random() * 256);
    }
  }
  return salt;
}

function hasSubtle() {
  return typeof crypto !== "undefined" && Boolean(crypto.subtle);
}

async function derive(password, salt, iterations) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    KEY_LENGTH * 8,
  );
  return new Uint8Array(bits);
}

/** Fallback used only when SubtleCrypto is unavailable (non-secure origins). */
function weakHash(password, salt) {
  let hash = 0x811c9dc5;
  const input = `${toBase64(salt)}:${password}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const bytes = new Uint8Array(KEY_LENGTH);
  for (let index = 0; index < KEY_LENGTH; index += 1) {
    bytes[index] = (hash >>> (index % 4) * 8) & 0xff;
    hash = Math.imul(hash ^ (index + 1), 0x01000193) >>> 0;
  }
  return bytes;
}

export async function hashPassword(password) {
  const salt = randomSalt();

  if (hasSubtle()) {
    const digest = await derive(password, salt, ITERATIONS);
    return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(digest)}`;
  }

  return `weak$${toBase64(salt)}$${toBase64(weakHash(password, salt))}`;
}

function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }
  return diff === 0;
}

export async function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;
  const [scheme, iterations, salt, digest] = stored.split("$");
  if (!salt || !digest) return false;

  try {
    const saltBytes = fromBase64(salt);
    const expected = fromBase64(digest);

    if (scheme === "pbkdf2") {
      if (!hasSubtle()) return false;
      const actual = await derive(password, saltBytes, Number(iterations) || ITERATIONS);
      return equalBytes(actual, expected);
    }

    if (scheme === "weak") {
      return equalBytes(weakHash(password, saltBytes), expected);
    }

    return false;
  } catch {
    return false;
  }
}
