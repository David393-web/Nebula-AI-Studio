CREATE TABLE "GenerationPreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Custom',
    "settings" JSONB NOT NULL,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GenerationPreset_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GenerationPreset_userId_type_category_idx" ON "GenerationPreset"("userId", "type", "category");
ALTER TABLE "GenerationPreset" ADD CONSTRAINT "GenerationPreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
