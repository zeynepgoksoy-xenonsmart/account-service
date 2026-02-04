/*
  This migration renames Account-related tables/columns to snake_case in the database
  while keeping camelCase field names in Prisma via @map/@@map.

  IMPORTANT:
  - This uses RENAME operations (no data loss).
  - Safe to run once on a DB created from the prior baseline migration.
*/

-- =========================
-- accounts
-- =========================
ALTER TABLE "accounts" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "accounts" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "accounts" RENAME COLUMN "deletedAt" TO "deleted_at";

-- =========================
-- AccountParameter -> account_parameters
-- =========================
ALTER TABLE "AccountParameter" RENAME TO "account_parameters";

ALTER TABLE "account_parameters" RENAME COLUMN "accountId" TO "account_id";
ALTER TABLE "account_parameters" RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE "account_parameters" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "account_parameters" RENAME COLUMN "updatedAt" TO "updated_at";

-- =========================
-- AccountSnapshot -> account_snapshots
-- =========================
ALTER TABLE "AccountSnapshot" RENAME TO "account_snapshots";

ALTER TABLE "account_snapshots" RENAME COLUMN "accountId" TO "account_id";
ALTER TABLE "account_snapshots" RENAME COLUMN "correlationId" TO "correlation_id";
ALTER TABLE "account_snapshots" RENAME COLUMN "correlationType" TO "correlation_type";
ALTER TABLE "account_snapshots" RENAME COLUMN "accountSnapshot" TO "account_snapshot";
ALTER TABLE "account_snapshots" RENAME COLUMN "parametersSnapshot" TO "parameters_snapshot";
ALTER TABLE "account_snapshots" RENAME COLUMN "snapshotReason" TO "snapshot_reason";
ALTER TABLE "account_snapshots" RENAME COLUMN "usedForCompensation" TO "used_for_compensation";
ALTER TABLE "account_snapshots" RENAME COLUMN "compensatedAt" TO "compensated_at";
ALTER TABLE "account_snapshots" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "account_snapshots" RENAME COLUMN "createdAt" TO "created_at";

-- =========================
-- Recreate indexes with new column names
-- =========================

-- accounts indexes
DROP INDEX IF EXISTS "accounts_deletedAt_idx";
CREATE INDEX "accounts_deleted_at_idx" ON "accounts"("deleted_at");

DROP INDEX IF EXISTS "accounts_createdAt_idx";
CREATE INDEX "accounts_created_at_idx" ON "accounts"("created_at");

-- account_parameters indexes
DROP INDEX IF EXISTS "AccountParameter_accountId_idx";
CREATE INDEX "account_parameters_account_id_idx" ON "account_parameters"("account_id");

DROP INDEX IF EXISTS "AccountParameter_isActive_idx";
CREATE INDEX "account_parameters_is_active_idx" ON "account_parameters"("is_active");

DROP INDEX IF EXISTS "AccountParameter_accountId_name_key";
CREATE UNIQUE INDEX "account_parameters_account_id_name_key" ON "account_parameters"("account_id", "name");

-- account_snapshots indexes
DROP INDEX IF EXISTS "AccountSnapshot_accountId_idx";
CREATE INDEX "account_snapshots_account_id_idx" ON "account_snapshots"("account_id");

DROP INDEX IF EXISTS "AccountSnapshot_correlationId_correlationType_idx";
CREATE INDEX "account_snapshots_correlation_id_correlation_type_idx" ON "account_snapshots"("correlation_id", "correlation_type");

DROP INDEX IF EXISTS "AccountSnapshot_createdAt_idx";
CREATE INDEX "account_snapshots_created_at_idx" ON "account_snapshots"("created_at");

DROP INDEX IF EXISTS "AccountSnapshot_expiresAt_idx";
CREATE INDEX "account_snapshots_expires_at_idx" ON "account_snapshots"("expires_at");

DROP INDEX IF EXISTS "AccountSnapshot_usedForCompensation_createdAt_idx";
CREATE INDEX "account_snapshots_used_for_compensation_created_at_idx" ON "account_snapshots"("used_for_compensation", "created_at");

-- =========================
-- Recreate foreign keys with new column names
-- =========================

-- Drop old foreign keys
ALTER TABLE "account_parameters" DROP CONSTRAINT IF EXISTS "AccountParameter_accountId_fkey";
ALTER TABLE "account_snapshots" DROP CONSTRAINT IF EXISTS "AccountSnapshot_accountId_fkey";

-- Create new foreign keys
ALTER TABLE "account_parameters" ADD CONSTRAINT "account_parameters_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account_snapshots" ADD CONSTRAINT "account_snapshots_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

