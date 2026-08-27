-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos';
