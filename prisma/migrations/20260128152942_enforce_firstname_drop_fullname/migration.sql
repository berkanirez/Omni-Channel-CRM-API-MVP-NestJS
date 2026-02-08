/*
  Warnings:

  - You are about to drop the column `fullName` on the `Contact` table. All the data in the column will be lost.
  - Made the column `firstName` on table `Contact` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "fullName",
ALTER COLUMN "firstName" SET NOT NULL;
