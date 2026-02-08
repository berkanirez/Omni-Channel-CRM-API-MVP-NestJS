-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ALTER COLUMN "fullName" DROP NOT NULL;
