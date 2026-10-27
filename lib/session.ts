// Signed session cookies shared by the edge gate and the access function.
// The cookie is `<issuedAt>.<hmac>` signed with ACCESS_CODE, so changing the code signs everyone out.
export const SESSION_COOKIE = "twf_access";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

async function sign(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function usablePasscode(passcode: string | undefined) {
  const trimmed = passcode?.trim();
  return trimmed && trimmed !== "change-this-code" ? trimmed : null;
}

export async function createSessionCookie(passcode: string) {
  const issuedAt = String(Date.now());
  const token = `${issuedAt}.${await sign(passcode, issuedAt)}`;
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

export async function hasValidSession(request: Request, passcode: string | null) {
  if (!passcode) return false;
  const match = (request.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=(\\d+)\\.([a-f\\d]{64})`));
  if (!match) return false;
  const [, issuedAt, signature] = match;
  if (Date.now() - Number(issuedAt) > MAX_AGE_SECONDS * 1000) return false;
  const expected = await sign(passcode, issuedAt);
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
