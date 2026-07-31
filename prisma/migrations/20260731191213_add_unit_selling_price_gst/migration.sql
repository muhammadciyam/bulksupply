-- AlterTable
ALTER TABLE "ProductUnit" ADD COLUMN     "gstApplicable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceExGst" DOUBLE PRECISION;
