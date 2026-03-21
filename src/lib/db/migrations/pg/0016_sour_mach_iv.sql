CREATE TABLE "academic_resource" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_name" text NOT NULL,
	"file_type" varchar NOT NULL,
	"file_size" text NOT NULL,
	"file_data" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_resource" ADD CONSTRAINT "academic_resource_uploaded_by_admin_credentials_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."admin_credentials"("id") ON DELETE cascade ON UPDATE no action;