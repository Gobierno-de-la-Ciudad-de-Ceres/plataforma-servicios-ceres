-- AlterTable
ALTER TABLE "job_posts" ADD COLUMN "location" TEXT;
ALTER TABLE "job_posts" ADD COLUMN "positionsCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "job_posts" ADD COLUMN "description" TEXT;

-- Backfill existing rows
UPDATE "job_posts"
SET
  "location" = COALESCE(NULLIF("location", ''), 'Ceres'),
  "description" = COALESCE(
    NULLIF("description", ''),
    LEFT(COALESCE("requirements", ''), 400)
  ),
  "positionsCount" = COALESCE("positionsCount", 1);

-- Enforce NOT NULL after backfill
ALTER TABLE "job_posts" ALTER COLUMN "location" SET NOT NULL;
ALTER TABLE "job_posts" ALTER COLUMN "description" SET NOT NULL;
