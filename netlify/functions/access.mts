import type { Config } from "@netlify/functions";
import { createHash, timingSafeEqual } from "node:crypto";
import { count } from "drizzle-orm";
import { db } from "../../db/index.js";
import { accessLockout, opens } from "../../db/schema.js";
import { createSessionCookie, usablePasscode } from "../../lib/session.ts";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000;

function codeMatches(passcode: string, attempt: unknown) {
  const expected = createHash("sha256").update(passcode).digest();
  const received = createHash("sha256").update(String(attempt || "").trim()).digest();
  return timingSafeEqual(expected, received);
}

export default async (request: Request) => {
  const passcode = usablePasscode(process.env.ACCESS_CODE);
  if (!passcode) return Response.json({ error: "This page is not ready yet." }, { status: 503 });

  const [lockout] = await db.select().from(accessLockout).limit(1);
  if (lockout?.lockoutUntil && lockout.lockoutUntil.getTime() > Date.now()) {
    return Response.json({ error: "Too many tries. Please wait a little and try again." }, { status: 429 });
  }

  let body: { code?: unknown; consent?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Please try again." }, { status: 400 }); }
  if (body.consent !== true) return Response.json({ error: "Please read the notice and confirm before continuing." }, { status: 400 });

  if (!codeMatches(passcode, body.code)) {
    const attempts = (lockout?.failedAttempts || 0) + 1;
    const locked = attempts >= MAX_ATTEMPTS;
    const state = { failedAttempts: locked ? 0 : attempts, lockoutUntil: locked ? new Date(Date.now() + LOCKOUT_MS) : null };
    await db.insert(accessLockout).values({ id: 1, ...state }).onConflictDoUpdate({ target: accessLockout.id, set: state });
    return Response.json({ error: "That code did not work. Try again." }, { status: 401 });
  }

  await db.insert(accessLockout).values({ id: 1, failedAttempts: 0, lockoutUntil: null })
    .onConflictDoUpdate({ target: accessLockout.id, set: { failedAttempts: 0, lockoutUntil: null } });
  await db.insert(opens).values({});
  const [{ openCount }] = await db.select({ openCount: count() }).from(opens);

  return Response.json({ redirect: "/surprise", openCount }, {
    headers: { "Set-Cookie": await createSessionCookie(passcode), "Cache-Control": "no-store" },
  });
};

export const config: Config = {
  path: "/api/access",
  method: "POST",
};
