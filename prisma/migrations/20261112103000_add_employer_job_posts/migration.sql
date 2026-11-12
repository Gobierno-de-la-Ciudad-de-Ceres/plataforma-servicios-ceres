-- CreateEnum
CREATE TYPE "EmployerTaxIdType" AS ENUM ('cuit', 'dni');

-- CreateEnum
CREATE TYPE "JobPostStatus" AS ENUM ('active', 'closed', 'taken_down');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'employer';

-- CreateTable
CREATE TABLE "employers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "taxIdType" "EmployerTaxIdType" NOT NULL,
    "phone" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posts" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "searchStartsAt" TIMESTAMP(3) NOT NULL,
    "searchEndsAt" TIMESTAMP(3) NOT NULL,
    "requirements" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "status" "JobPostStatus" NOT NULL DEFAULT 'active',
    "takenDownAt" TIMESTAMP(3),
    "takenDownReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employers_userId_key" ON "employers"("userId");

-- CreateIndex
CREATE INDEX "job_posts_status_searchStartsAt_searchEndsAt_idx" ON "job_posts"("status", "searchStartsAt", "searchEndsAt");

-- CreateIndex
CREATE INDEX "job_posts_employerId_idx" ON "job_posts"("employerId");

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posts" ADD CONSTRAINT "job_posts_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
