-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_moduleId_fkey";

-- AlterTable
ALTER TABLE "questions" ALTER COLUMN "moduleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
