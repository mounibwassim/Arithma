CREATE TABLE "survey_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_email" text,
	"user_name" text,
	"rating" varchar NOT NULL,
	"feedback" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_credentials" ADD COLUMN "role" varchar DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "survey_response" ADD CONSTRAINT "survey_response_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;