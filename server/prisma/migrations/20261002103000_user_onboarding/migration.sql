ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ALTER COLUMN "onboardingCompleted" SET DEFAULT false;
