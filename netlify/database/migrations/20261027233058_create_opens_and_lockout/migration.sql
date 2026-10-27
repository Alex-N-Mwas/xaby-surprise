CREATE TABLE "access_lockout" (
	"id" integer PRIMARY KEY,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"lockout_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "opens" (
	"id" serial PRIMARY KEY,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL
);
