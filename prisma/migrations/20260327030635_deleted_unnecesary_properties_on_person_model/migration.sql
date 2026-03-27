/*
  Warnings:

  - You are about to drop the column `moodle_id` on the `person` table. All the data in the column will be lost.
  - You are about to drop the column `synchronized_at` on the `person` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_person_moodle";

-- DropIndex
DROP INDEX "person_moodle_id_key";

-- AlterTable
ALTER TABLE "person" DROP COLUMN "moodle_id",
DROP COLUMN "synchronized_at";
