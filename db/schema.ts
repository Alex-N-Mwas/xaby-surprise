import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

// One row per successful, consented entry. Only the time is stored.
export const opens = pgTable("opens", {
  id: serial().primaryKey(),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
});

// Single-row table (id = 1) tracking wrong passcode attempts.
export const accessLockout = pgTable("access_lockout", {
  id: integer().primaryKey(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockoutUntil: timestamp("lockout_until", { withTimezone: true }),
});
