-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "businessAddress" TEXT,
ADD COLUMN     "businessEmail" TEXT,
ADD COLUMN     "businessGstNo" TEXT,
ADD COLUMN     "businessName" TEXT NOT NULL DEFAULT 'Bulk Supply',
ADD COLUMN     "businessPhone" TEXT;
