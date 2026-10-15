ALTER TABLE "person" ALTER COLUMN "email" SET DATA TYPE VARCHAR(120);

UPDATE "user_role" AS ur
SET "role_id" = (SELECT "id" FROM "role" WHERE "name" = 'USER')
WHERE "role_id" IN (SELECT "id" FROM "role" WHERE "name" IN ('STUDENT', 'TEACHER'))
  AND NOT EXISTS (
    SELECT 1 FROM "user_role" AS x
    WHERE x."user_id" = ur."user_id"
      AND x."role_id" = (SELECT "id" FROM "role" WHERE "name" = 'USER')
  );

DELETE FROM "user_role"
WHERE "role_id" IN (SELECT "id" FROM "role" WHERE "name" IN ('STUDENT', 'TEACHER'));

DELETE FROM "role" WHERE "name" IN ('STUDENT', 'TEACHER');

CREATE TYPE "Roles_new" AS ENUM ('ADMIN', 'USER');
ALTER TABLE "role" ALTER COLUMN "name" DROP DEFAULT;
ALTER TABLE "role" ALTER COLUMN "name" TYPE "Roles_new" USING ("name"::text::"Roles_new");
ALTER TABLE "role" ALTER COLUMN "name" SET DEFAULT 'USER';
DROP TYPE "Roles";
ALTER TYPE "Roles_new" RENAME TO "Roles";
