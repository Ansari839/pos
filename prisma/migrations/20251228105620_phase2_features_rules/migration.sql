-- AlterTable
ALTER TABLE "Feature" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "Industry" ADD COLUMN     "defaultConfig" JSONB;

-- CreateTable
CREATE TABLE "BusinessRule" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "ruleValue" JSONB NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRule_businessId_ruleKey_key" ON "BusinessRule"("businessId", "ruleKey");

-- AddForeignKey
ALTER TABLE "BusinessRule" ADD CONSTRAINT "BusinessRule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
