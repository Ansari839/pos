-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "costPrice" DECIMAL(18,4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StockAdjustment" ADD COLUMN     "value" DECIMAL(18,4);
