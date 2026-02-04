-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountParameter" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "correlationId" TEXT,
    "correlationType" TEXT,
    "accountSnapshot" JSONB NOT NULL,
    "parametersSnapshot" JSONB NOT NULL,
    "snapshotReason" TEXT,
    "usedForCompensation" BOOLEAN NOT NULL DEFAULT false,
    "compensatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE INDEX "accounts_email_idx" ON "accounts"("email");

-- CreateIndex
CREATE INDEX "accounts_deletedAt_idx" ON "accounts"("deletedAt");

-- CreateIndex
CREATE INDEX "accounts_createdAt_idx" ON "accounts"("createdAt");

-- CreateIndex
CREATE INDEX "AccountParameter_accountId_idx" ON "AccountParameter"("accountId");

-- CreateIndex
CREATE INDEX "AccountParameter_name_idx" ON "AccountParameter"("name");

-- CreateIndex
CREATE INDEX "AccountParameter_isActive_idx" ON "AccountParameter"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AccountParameter_accountId_name_key" ON "AccountParameter"("accountId", "name");

-- CreateIndex
CREATE INDEX "AccountSnapshot_accountId_idx" ON "AccountSnapshot"("accountId");

-- CreateIndex
CREATE INDEX "AccountSnapshot_correlationId_correlationType_idx" ON "AccountSnapshot"("correlationId", "correlationType");

-- CreateIndex
CREATE INDEX "AccountSnapshot_createdAt_idx" ON "AccountSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "AccountSnapshot_expiresAt_idx" ON "AccountSnapshot"("expiresAt");

-- CreateIndex
CREATE INDEX "AccountSnapshot_usedForCompensation_createdAt_idx" ON "AccountSnapshot"("usedForCompensation", "createdAt");

-- AddForeignKey
ALTER TABLE "AccountParameter" ADD CONSTRAINT "AccountParameter_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountSnapshot" ADD CONSTRAINT "AccountSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
