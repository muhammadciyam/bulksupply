/*
  Warnings:

  - You are about to drop the column `banner1ImageUrl` on the `AppSettings` table. All the data in the column will be lost.
  - You are about to drop the column `banner2ImageUrl` on the `AppSettings` table. All the data in the column will be lost.
  - You are about to drop the column `banner3ImageUrl` on the `AppSettings` table. All the data in the column will be lost.
  - You are about to drop the column `banner4ImageUrl` on the `AppSettings` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "BannerImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slot" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- DataMigration: carry over any existing single banner images into the new table
INSERT INTO "BannerImage" ("id", "slot", "imageUrl", "sortOrder")
SELECT lower(hex(randomblob(16))), 1, "banner1ImageUrl", 0 FROM "AppSettings" WHERE "banner1ImageUrl" IS NOT NULL;
INSERT INTO "BannerImage" ("id", "slot", "imageUrl", "sortOrder")
SELECT lower(hex(randomblob(16))), 2, "banner2ImageUrl", 0 FROM "AppSettings" WHERE "banner2ImageUrl" IS NOT NULL;
INSERT INTO "BannerImage" ("id", "slot", "imageUrl", "sortOrder")
SELECT lower(hex(randomblob(16))), 3, "banner3ImageUrl", 0 FROM "AppSettings" WHERE "banner3ImageUrl" IS NOT NULL;
INSERT INTO "BannerImage" ("id", "slot", "imageUrl", "sortOrder")
SELECT lower(hex(randomblob(16))), 4, "banner4ImageUrl", 0 FROM "AppSettings" WHERE "banner4ImageUrl" IS NOT NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "paymentDeadlineDays" INTEGER NOT NULL DEFAULT 3
);
INSERT INTO "new_AppSettings" ("id", "paymentDeadlineDays") SELECT "id", "paymentDeadlineDays" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BannerImage_slot_idx" ON "BannerImage"("slot");
