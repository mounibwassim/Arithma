CREATE TABLE IF NOT EXISTS "admin_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "admin_credentials_username_unique" UNIQUE("username")
);
