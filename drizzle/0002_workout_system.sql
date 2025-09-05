-- Drop the old workouts table structure
DROP TABLE IF EXISTS "workouts";

-- Create new workouts table for our workout system
CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"miles" numeric(5, 2) NOT NULL,
	"description" text NOT NULL,
	"is_workout" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "miles_check" CHECK ("workouts"."miles" >= 0)
);

-- Create training_days table (this was missing from original migrations)
CREATE TABLE "training_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"date" date NOT NULL,
	"workout_id" uuid,
	"actual_miles" numeric(5, 2),
	"actual_notes" text,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "day_of_week_check" CHECK ("training_days"."day_of_week" >= 1 AND "training_days"."day_of_week" <= 7),
	CONSTRAINT "actual_miles_check" CHECK ("training_days"."actual_miles" >= 0)
);

-- Add foreign key constraints
ALTER TABLE "training_days" ADD CONSTRAINT "training_days_week_id_training_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "training_weeks"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "training_days" ADD CONSTRAINT "training_days_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE set null ON UPDATE no action;